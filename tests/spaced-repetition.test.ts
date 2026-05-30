import { describe, expect, it } from "vitest";

import {
  freshSrState,
  isDue,
  isGraduated,
  planReviewUpdate,
  scheduleNext,
  type SrState,
} from "@/lib/spaced-repetition";

const T0 = Date.parse("2026-05-30T00:00:00Z");
const DAY = 86_400_000;

describe("freshSrState", () => {
  it("is due immediately with the default ease and no reps", () => {
    const s = freshSrState(T0);
    expect(s.dueAt).toBe(T0);
    expect(s.ease).toBe(2.5);
    expect(s.reps).toBe(0);
    expect(s.intervalDays).toBe(0);
    expect(isDue(s, T0)).toBe(true);
  });
});

describe("scheduleNext — correct answers grow the interval", () => {
  it("schedules 1 day out on the first correct recall", () => {
    const s = scheduleNext(freshSrState(T0), true, T0);
    expect(s.intervalDays).toBe(1);
    expect(s.reps).toBe(1);
    expect(s.dueAt).toBe(T0 + 1 * DAY);
    expect(isDue(s, T0)).toBe(false);
  });

  it("schedules 3 days out on the second consecutive correct", () => {
    let s = scheduleNext(freshSrState(T0), true, T0);
    s = scheduleNext(s, true, s.dueAt);
    expect(s.intervalDays).toBe(3);
    expect(s.reps).toBe(2);
  });

  it("grows by the ease factor from the third correct on", () => {
    let s = scheduleNext(freshSrState(T0), true, T0); // 1d, ease 2.55
    s = scheduleNext(s, true, s.dueAt); // 3d, ease 2.6
    const before = s.intervalDays; // 3
    s = scheduleNext(s, true, s.dueAt); // round(3 * 2.6) = 8
    expect(s.intervalDays).toBe(Math.round(before * 2.6));
    expect(s.reps).toBe(3);
  });
});

describe("scheduleNext — a miss is a lapse", () => {
  it("resets reps, collapses to due-now, and lowers ease", () => {
    let s = scheduleNext(freshSrState(T0), true, T0);
    s = scheduleNext(s, true, s.dueAt); // built some progress, ease 2.6
    const lapsed = scheduleNext(s, false, T0 + 100 * DAY);
    expect(lapsed.reps).toBe(0);
    expect(lapsed.intervalDays).toBe(0);
    expect(lapsed.dueAt).toBe(T0 + 100 * DAY); // due immediately
    expect(lapsed.ease).toBeCloseTo(2.4); // 2.6 - 0.2
    expect(isDue(lapsed, T0 + 100 * DAY)).toBe(true);
  });

  it("floors ease at 1.3 no matter how many lapses", () => {
    let s: SrState = freshSrState(T0);
    for (let i = 0; i < 20; i++) s = scheduleNext(s, false, T0);
    expect(s.ease).toBe(1.3);
  });
});

describe("isGraduated", () => {
  it("is false for a young card and true once the interval is long", () => {
    expect(isGraduated({ ease: 2.5, intervalDays: 6, reps: 3, dueAt: T0 })).toBe(
      false,
    );
    expect(
      isGraduated({ ease: 2.5, intervalDays: 21, reps: 6, dueAt: T0 }),
    ).toBe(true);
  });

  it("a card reliably recalled eventually graduates", () => {
    let s = freshSrState(T0);
    let guard = 0;
    while (!isGraduated(s) && guard < 50) {
      s = scheduleNext(s, true, s.dueAt);
      guard += 1;
    }
    expect(isGraduated(s)).toBe(true);
    expect(guard).toBeLessThan(10); // 1 -> 3 -> 8 -> ~21, a handful of reviews
  });
});

describe("planReviewUpdate — DB-layer branching, without a DB", () => {
  it("a fresh miss graded correct advances but does not retire", () => {
    const plan = planReviewUpdate(freshSrState(T0), true, T0);
    expect(plan.retire).toBe(false);
    expect(plan.next.intervalDays).toBe(1);
    expect(plan.next.reps).toBe(1);
  });

  it("a miss never retires, even from a long-interval card", () => {
    // A near-graduated card answered wrong must stay in the backlog.
    const mature: SrState = { ease: 2.5, intervalDays: 20, reps: 5, dueAt: T0 };
    const plan = planReviewUpdate(mature, false, T0);
    expect(plan.retire).toBe(false);
    expect(plan.next.intervalDays).toBe(0); // lapsed back to due-now
    expect(plan.next.dueAt).toBe(T0);
  });

  it("a correct answer that crosses the threshold retires the card", () => {
    // intervalDays 20, ease 2.5 -> next correct = round(20 * 2.5) = 50 >= 21.
    const mature: SrState = { ease: 2.5, intervalDays: 20, reps: 5, dueAt: T0 };
    const plan = planReviewUpdate(mature, true, T0);
    expect(plan.retire).toBe(true);
    expect(plan.next.intervalDays).toBeGreaterThanOrEqual(21);
  });

  it("respects a custom graduation threshold", () => {
    const s: SrState = { ease: 2.5, intervalDays: 2, reps: 2, dueAt: T0 };
    // next correct interval = round(2 * 2.5) = 5.
    expect(planReviewUpdate(s, true, T0, 21).retire).toBe(false);
    expect(planReviewUpdate(s, true, T0, 4).retire).toBe(true);
  });
});
