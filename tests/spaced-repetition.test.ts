import { describe, expect, it } from "vitest";

import {
  freshSrState,
  isDue,
  isGraduated,
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
