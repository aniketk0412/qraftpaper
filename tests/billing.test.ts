import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { verifyWebhookSignature } from "@/lib/billing/webhook-signature";

const SECRET = "whsec_test_secret_value";

function sign(body: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ meta: { event_name: "subscription_created" } });

  it("accepts a signature produced with the correct secret + body", () => {
    expect(verifyWebhookSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a tampered body (the core forgery defence)", () => {
    const goodSig = sign(body);
    const tampered = body.replace("created", "cancelled");
    expect(verifyWebhookSignature(tampered, goodSig, SECRET)).toBe(false);
  });

  it("rejects a signature made with the wrong secret", () => {
    expect(verifyWebhookSignature(body, sign(body, "attacker"), SECRET)).toBe(
      false,
    );
  });

  it("rejects an empty signature without throwing", () => {
    expect(verifyWebhookSignature(body, "", SECRET)).toBe(false);
  });

  it("rejects a non-hex / garbage signature without throwing", () => {
    expect(verifyWebhookSignature(body, "not-a-hex-signature", SECRET)).toBe(
      false,
    );
    expect(verifyWebhookSignature(body, "zzzz", SECRET)).toBe(false);
  });

  it("rejects a valid-hex signature of the wrong length without throwing", () => {
    // 8 hex chars = 4 bytes, far short of a 32-byte sha256 digest. The length
    // guard must catch this before timingSafeEqual (which throws on mismatch).
    expect(verifyWebhookSignature(body, "deadbeef", SECRET)).toBe(false);
  });

  it("is sensitive to a single-byte change in the signature", () => {
    const sig = sign(body);
    const flipped =
      (sig[0] === "a" ? "b" : "a") + sig.slice(1); // flip first nibble
    expect(verifyWebhookSignature(body, flipped, SECRET)).toBe(false);
  });
});

/**
 * Tier mapping decides which checkouts are accepted and which plan a webhook
 * grants. It reads process.env at call time, so we set the variant ids in a
 * fresh module context per test.
 */
describe("billing tier mapping", () => {
  const ORIGINAL = { ...process.env };

  beforeEach(() => {
    process.env.LEMONSQUEEZY_VARIANT_EDUCATOR = "variant_educator_123";
    process.env.LEMONSQUEEZY_VARIANT_DEPARTMENT = "variant_department_456";
  });
  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it("maps a known variant id to its tier", async () => {
    const { tierForVariantId } = await import("@/lib/billing/lemonsqueezy");
    expect(tierForVariantId("variant_educator_123")).toBe("educator");
    expect(tierForVariantId("variant_department_456")).toBe("department");
  });

  it("maps an unknown variant id to null (never silently grants a plan)", async () => {
    const { tierForVariantId } = await import("@/lib/billing/lemonsqueezy");
    expect(tierForVariantId("variant_unknown")).toBeNull();
    expect(tierForVariantId("")).toBeNull();
  });

  it("only accepts the publicly-sellable tier at checkout", async () => {
    const { isBillingTier } = await import("@/lib/billing/lemonsqueezy");
    // Solo (educator) is the only tier sold today; department/garbage must
    // be refused so nobody checks out an unlisted or vapourware plan.
    expect(isBillingTier("educator")).toBe(true);
    expect(isBillingTier("department")).toBe(false);
    expect(isBillingTier("institution")).toBe(false);
    expect(isBillingTier("free")).toBe(false);
    expect(isBillingTier(undefined)).toBe(false);
    expect(isBillingTier(123)).toBe(false);
  });
});
