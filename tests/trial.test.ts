import { describe, expect, it } from "vitest";

import {
  TRIAL_DURATION_MS,
  TRIAL_PLAN_ID,
  effectivePlan,
  isTrialExpired,
  trialEndsFrom,
} from "@/lib/billing/trial";

const NOW = new Date("2026-06-23T12:00:00Z");
const FUTURE = new Date(NOW.getTime() + 60_000); // 1 min ahead
const PAST = new Date(NOW.getTime() - 60_000); // 1 min ago

describe("isTrialExpired", () => {
  it("is false for any non-trial plan regardless of date", () => {
    expect(isTrialExpired("educator", PAST, NOW)).toBe(false);
    expect(isTrialExpired("unpaid", null, NOW)).toBe(false);
  });

  it("is false while the pass is still within its window", () => {
    expect(isTrialExpired(TRIAL_PLAN_ID, FUTURE, NOW)).toBe(false);
  });

  it("is true once the end date has passed", () => {
    expect(isTrialExpired(TRIAL_PLAN_ID, PAST, NOW)).toBe(true);
  });

  it("treats a trial with no end date as expired (defensive)", () => {
    expect(isTrialExpired(TRIAL_PLAN_ID, null, NOW)).toBe(true);
    expect(isTrialExpired(TRIAL_PLAN_ID, undefined, NOW)).toBe(true);
  });

  it("treats the exact boundary as expired (<=)", () => {
    expect(isTrialExpired(TRIAL_PLAN_ID, NOW, NOW)).toBe(true);
  });
});

describe("effectivePlan", () => {
  it("collapses an expired pass to unpaid", () => {
    expect(effectivePlan(TRIAL_PLAN_ID, PAST, NOW)).toBe("unpaid");
    expect(effectivePlan(TRIAL_PLAN_ID, null, NOW)).toBe("unpaid");
  });

  it("keeps an active pass on trial", () => {
    expect(effectivePlan(TRIAL_PLAN_ID, FUTURE, NOW)).toBe(TRIAL_PLAN_ID);
  });

  it("passes every other plan through unchanged", () => {
    expect(effectivePlan("educator", null, NOW)).toBe("educator");
    expect(effectivePlan("unpaid", null, NOW)).toBe("unpaid");
  });
});

describe("trialEndsFrom", () => {
  it("ends exactly the trial duration after the start", () => {
    expect(trialEndsFrom(NOW).getTime()).toBe(NOW.getTime() + TRIAL_DURATION_MS);
  });

  it("the resulting window is in the future and not yet expired", () => {
    const ends = trialEndsFrom(NOW);
    expect(isTrialExpired(TRIAL_PLAN_ID, ends, NOW)).toBe(false);
  });
});
