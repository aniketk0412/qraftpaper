import { describe, expect, it } from "vitest";

import { computeReadiness, type ReadinessInputs } from "@/lib/exam-readiness";

function inputs(over: Partial<ReadinessInputs> = {}): ReadinessInputs {
  return {
    hasProfile: true,
    masteryPct: 80,
    quizzesTaken: 5,
    papersGenerated: 2,
    ...over,
  };
}

describe("computeReadiness — gating", () => {
  it("is unmeasurable (null) with no profile", () => {
    const r = computeReadiness(inputs({ hasProfile: false }));
    expect(r.score).toBeNull();
    expect(r.band).toBe("setup");
  });

  it("stays low and 'starting' when set up but no quiz taken", () => {
    const r = computeReadiness(
      inputs({ quizzesTaken: 0, masteryPct: null, papersGenerated: 0 }),
    );
    expect(r.band).toBe("starting");
    expect(r.score).toBeLessThanOrEqual(20);
    expect(r.score).toBeGreaterThan(0);
  });

  it("treats a null masteryPct like no practice even if quizzesTaken is set", () => {
    const r = computeReadiness(inputs({ masteryPct: null, quizzesTaken: 3 }));
    expect(r.band).toBe("starting");
  });
});

describe("computeReadiness — confidence (practice must back up the score)", () => {
  it("discounts a high score earned from a single quiz", () => {
    const one = computeReadiness(inputs({ masteryPct: 90, quizzesTaken: 1 }));
    const many = computeReadiness(inputs({ masteryPct: 90, quizzesTaken: 5 }));
    // Same average, but more reps = higher (more trusted) readiness.
    expect(one.score!).toBeLessThan(many.score!);
    expect(many.score).toBe(90);
  });

  it("rewards taking more quizzes at the same average", () => {
    const a = computeReadiness(inputs({ masteryPct: 70, quizzesTaken: 1 })).score!;
    const b = computeReadiness(inputs({ masteryPct: 70, quizzesTaken: 3 })).score!;
    const c = computeReadiness(inputs({ masteryPct: 70, quizzesTaken: 5 })).score!;
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });

  it("caps confidence at the threshold (no runaway above the raw average)", () => {
    const five = computeReadiness(inputs({ masteryPct: 75, quizzesTaken: 5 })).score!;
    const fifty = computeReadiness(inputs({ masteryPct: 75, quizzesTaken: 50 })).score!;
    expect(five).toBe(75);
    expect(fifty).toBe(75); // more than enough reps doesn't inflate past the score
  });
});

describe("computeReadiness — bands", () => {
  it("lands in the right band across the range", () => {
    expect(computeReadiness(inputs({ masteryPct: 95, quizzesTaken: 5 })).band).toBe("ready");
    expect(computeReadiness(inputs({ masteryPct: 70, quizzesTaken: 5 })).band).toBe("solid");
    expect(computeReadiness(inputs({ masteryPct: 45, quizzesTaken: 5 })).band).toBe("building");
    expect(computeReadiness(inputs({ masteryPct: 15, quizzesTaken: 5 })).band).toBe("starting");
  });

  it("always carries a non-empty label and message", () => {
    for (const pct of [0, 30, 60, 90]) {
      const r = computeReadiness(inputs({ masteryPct: pct }));
      expect(r.label.length).toBeGreaterThan(0);
      expect(r.message.length).toBeGreaterThan(0);
    }
  });
});

describe("computeReadiness — robustness", () => {
  it("clamps an out-of-range or non-finite mastery", () => {
    expect(computeReadiness(inputs({ masteryPct: 140 })).score).toBeLessThanOrEqual(100);
    expect(computeReadiness(inputs({ masteryPct: Number.NaN })).band).toBe("starting");
  });

  it("never returns a score outside 0–100", () => {
    for (const pct of [-50, 0, 50, 100, 999]) {
      for (const taken of [0, 1, 5, 100]) {
        const r = computeReadiness(inputs({ masteryPct: pct, quizzesTaken: taken }));
        if (r.score !== null) {
          expect(r.score).toBeGreaterThanOrEqual(0);
          expect(r.score).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});
