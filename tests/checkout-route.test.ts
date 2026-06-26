import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Pins the gates on the billing checkout route: an anonymous caller is 401'd,
 * an unverified user is 403'd BEFORE any checkout is created, and a verified
 * user proceeds. Mirrors tests/route-guards.test.ts — mock the collaborators,
 * call the handler, assert the status. The point is to fail loudly if the
 * email-verification gate is ever removed (which would let disposable/unverified
 * accounts buy the $1 pass).
 */
const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

const isEmailVerified = vi.fn();
vi.mock("@/lib/verification", () => ({ isEmailVerified: () => isEmailVerified() }));

// Make billing look configured and the checkout succeed, so the verification
// gate is the thing under test rather than a 503 or a real Lemon Squeezy call.
const createBillingCheckout = vi.fn();
vi.mock("@/lib/billing/lemonsqueezy", () => ({
  isBillingConfigured: () => true,
  isBillingTier: (t: unknown) => t === "trial" || t === "solo",
  createBillingCheckout: () => createBillingCheckout(),
}));

vi.mock("@/lib/billing/trial", () => ({
  isTrialEligible: () => Promise.resolve(true),
}));
vi.mock("@/lib/observability", () => ({ captureException: () => {} }));

import { POST as checkout } from "@/app/api/billing/checkout/route";

function req(tier: unknown): Request {
  return new Request("http://t/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier }),
  });
}

const SIGNED_IN = { user: { id: "u1", email: "a@b.com", name: "Anya" } };

beforeEach(() => vi.clearAllMocks());

describe("POST /api/billing/checkout — email-verification gate", () => {
  it("401s an anonymous caller", async () => {
    auth.mockResolvedValue(null);
    expect((await checkout(req("trial"))).status).toBe(401);
  });

  it("403s a signed-in but unverified user, before any checkout is created", async () => {
    auth.mockResolvedValue(SIGNED_IN);
    isEmailVerified.mockResolvedValue(false);

    const res = await checkout(req("trial"));

    expect(res.status).toBe(403);
    expect(createBillingCheckout).not.toHaveBeenCalled();
  });

  it("lets a verified user reach checkout", async () => {
    auth.mockResolvedValue(SIGNED_IN);
    isEmailVerified.mockResolvedValue(true);
    createBillingCheckout.mockResolvedValue("https://checkout.example/session");

    const res = await checkout(req("trial"));

    expect(res.status).toBe(200);
    const body = (await res.json()) as { checkoutUrl?: string };
    expect(body.checkoutUrl).toBe("https://checkout.example/session");
    expect(createBillingCheckout).toHaveBeenCalledTimes(1);
  });
});
