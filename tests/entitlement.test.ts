import { describe, expect, it } from "vitest";

import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  INACTIVE_SUBSCRIPTION_STATUSES,
  resolveEntitlement,
} from "@/lib/billing/entitlement";

describe("resolveEntitlement", () => {
  it("grants the paid plan for every active status", () => {
    for (const status of ACTIVE_SUBSCRIPTION_STATUSES) {
      expect(resolveEntitlement(status, "educator")).toEqual({
        shouldUpdate: true,
        plan: "educator",
        granting: true,
      });
    }
  });

  it("revokes to unpaid for every inactive status", () => {
    for (const status of INACTIVE_SUBSCRIPTION_STATUSES) {
      expect(resolveEntitlement(status, "educator")).toEqual({
        shouldUpdate: true,
        plan: "unpaid",
        granting: false,
      });
    }
  });

  it("LEAVES entitlement untouched for an unknown status (the key guard)", () => {
    // A status Lemon Squeezy adds later, or a typo, must never silently
    // revoke a paying customer.
    expect(resolveEntitlement("something_new", "educator")).toEqual({
      shouldUpdate: false,
      plan: "unpaid",
      granting: false,
    });
    expect(resolveEntitlement("", "educator").shouldUpdate).toBe(false);
  });

  it("grants whatever tier it's handed (doesn't hard-code educator)", () => {
    expect(resolveEntitlement("active", "trial")).toEqual({
      shouldUpdate: true,
      plan: "trial",
      granting: true,
    });
  });

  it("active and inactive sets do not overlap", () => {
    for (const s of ACTIVE_SUBSCRIPTION_STATUSES) {
      expect(INACTIVE_SUBSCRIPTION_STATUSES.has(s)).toBe(false);
    }
  });
});
