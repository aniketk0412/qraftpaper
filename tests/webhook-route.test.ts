import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Analytics is mocked to avoid any import-time client construction; these
// tests never reach the code path that calls it anyway.
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { POST } from "@/app/api/billing/webhook/route";

const SECRET = "test-webhook-secret";

function sign(body: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function webhookReq(body: string, signature?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (signature !== undefined) headers["x-signature"] = signature;
  return new Request("http://t/api/billing/webhook", {
    method: "POST",
    headers,
    body,
  });
}

let originalSecret: string | undefined;

beforeEach(() => {
  originalSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = SECRET;
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  else process.env.LEMONSQUEEZY_WEBHOOK_SECRET = originalSecret;
});

/**
 * The webhook's pre-DB gates ARE the anti-fraud boundary: a forged or unsigned
 * request must never reach the subscription/user-plan writes. All of these
 * return before any getDb() call, so no database is needed.
 */
describe("POST /api/billing/webhook — security gates", () => {
  it("503s when the webhook secret isn't configured", async () => {
    delete process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
    const res = await POST(webhookReq(body, sign(body)));
    expect(res.status).toBe(503);
  });

  it("401s a request with no signature header", async () => {
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
    const res = await POST(webhookReq(body));
    expect(res.status).toBe(401);
  });

  it("401s a request with a forged signature", async () => {
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
    const res = await POST(webhookReq(body, "deadbeef"));
    expect(res.status).toBe(401);
  });

  it("401s a body signed with the WRONG secret", async () => {
    const body = JSON.stringify({ meta: { event_name: "subscription_created" } });
    const res = await POST(webhookReq(body, sign(body, "attacker-secret")));
    expect(res.status).toBe(401);
  });

  it("400s a correctly-signed body that isn't valid JSON", async () => {
    const body = "{ not json";
    const res = await POST(webhookReq(body, sign(body)));
    expect(res.status).toBe(400);
  });
});
