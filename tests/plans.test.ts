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
  it("publicly sells a single Solo tier today", () => {
    // Crew/department is kept in PLANS for legacy DB rows + future workspace
    // sharing, but it isn't publicly sold — no real multi-user workspace
    // feature exists yet, so listing it would be selling vapourware.
    // Institution stays internal-only for the same reason.
    expect(PRICING_TIERS.map((t) => t.id)).toEqual(["educator"]);
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
