import { describe, expect, it } from "vitest";

import { PLANS, PRICING_TIERS, planLimits } from "@/lib/plans";

describe("planLimits", () => {
  it("returns the limits for known plans", () => {
    expect(planLimits("trial").generationsPerMonth).toBe(3);
    expect(planLimits("trial").maxSubjects).toBe(1);
    expect(planLimits("educator").generationsPerMonth).toBe(20);
    expect(planLimits("educator").maxSubjects).toBe(5);
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
  it("publicly sells the trial-to-Solo ladder", () => {
    expect(PRICING_TIERS.map((t) => t.id)).toEqual(["trial", "educator"]);
  });

  it("keeps the advertised prices in sync", () => {
    expect(PLANS.trial.price).toBe("$1");
    expect(PLANS.educator.price).toBe("$7");
  });
});
