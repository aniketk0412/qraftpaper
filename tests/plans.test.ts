import { describe, expect, it } from "vitest";

import { PLANS, PRICING_TIERS, planLimits } from "@/lib/plans";

describe("planLimits", () => {
  it("returns the limits for known plans", () => {
    expect(planLimits("educator").generationsPerMonth).toBe(20);
    expect(planLimits("educator").maxSubjects).toBe(5);
    expect(planLimits("department").generationsPerMonth).toBe(90);
    expect(planLimits("department").maxSubjects).toBe(25);
  });

  it("treats institution as unlimited (null)", () => {
    const limits = planLimits("institution");
    expect(limits.generationsPerMonth).toBeNull();
    expect(limits.maxSubjects).toBeNull();
    expect(limits.papersPerSubject).toBeNull();
  });

  it("blocks the unpaid plan from generating", () => {
    expect(planLimits("unpaid").generationsPerMonth).toBe(0);
    expect(planLimits("unpaid").maxSubjects).toBe(0);
  });

  it("falls back to educator for an unknown plan", () => {
    expect(planLimits("nonsense")).toEqual(planLimits("educator"));
  });
});

describe("pricing tiers", () => {
  it("lists only the publicly purchasable tiers in display order", () => {
    // Institution is intentionally excluded — LemonSqueezy won't approve a
    // "Custom / Talk to sales" tier on the public page. The plan id still
    // exists in PLANS for any future hand-arranged enterprise deal.
    expect(PRICING_TIERS.map((t) => t.id)).toEqual(["educator", "department"]);
  });

  it("does not surface a non-purchasable Custom price publicly", () => {
    expect(PRICING_TIERS.every((t) => t.price !== "Custom")).toBe(true);
  });

  it("keeps the advertised prices in sync", () => {
    expect(PLANS.educator.price).toBe("$7");
    expect(PLANS.department.price).toBe("$24");
    expect(PLANS.institution.price).toBe("Custom");
  });
});
