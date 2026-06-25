import { afterEach, describe, expect, it } from "vitest";

import { getCustomerPortalUrl } from "@/lib/billing/lemonsqueezy";

const ORIGINAL_KEY = process.env.LEMONSQUEEZY_API_KEY;

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.LEMONSQUEEZY_API_KEY;
  else process.env.LEMONSQUEEZY_API_KEY = ORIGINAL_KEY;
});

describe("getCustomerPortalUrl", () => {
  it("returns null (graceful fallback) when billing isn't configured", async () => {
    delete process.env.LEMONSQUEEZY_API_KEY;
    // No API key → returns null without ever calling the network, so the
    // billing page falls back to the checkout button instead of erroring.
    await expect(getCustomerPortalUrl("sub_123")).resolves.toBeNull();
  });
});
