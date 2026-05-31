import { describe, expect, it } from "vitest";

import { describeGenerationUsage } from "@/lib/generation-usage";

describe("describeGenerationUsage — unlimited", () => {
  it("never nudges and reports unlimited regardless of usage", () => {
    const r = describeGenerationUsage(9999, null);
    expect(r.level).toBe("unlimited");
    expect(r.nudge).toBe(false);
    expect(r.remaining).toBeNull();
    expect(r.pct).toBe(0);
  });
});

describe("describeGenerationUsage — the nudge fires at the right time", () => {
  // Educator-style cap of 20: 10% threshold = 2, so low at remaining ≤ 2.
  const cap = 20;

  it("stays OK (no nudge) with more than the threshold left", () => {
    for (const used of [0, 1, 10, 16, 17]) {
      const r = describeGenerationUsage(used, cap);
      expect(r.level).toBe("ok");
      expect(r.nudge).toBe(false);
    }
  });

  it("treats remaining === threshold (2) as the first LOW step", () => {
    // remaining 3 -> ok, remaining 2 -> low (boundary).
    expect(describeGenerationUsage(17, cap)).toMatchObject({ remaining: 3, level: "ok" });
    const low = describeGenerationUsage(18, cap); // remaining 2
    expect(low.level).toBe("low");
    expect(low.nudge).toBe(true);
    expect(low.remaining).toBe(2);
    expect(describeGenerationUsage(19, cap).level).toBe("low"); // remaining 1
  });

  it("is EXHAUSTED at and beyond the cap", () => {
    const atCap = describeGenerationUsage(20, cap);
    expect(atCap.level).toBe("exhausted");
    expect(atCap.nudge).toBe(true);
    expect(atCap.remaining).toBe(0);
    expect(atCap.pct).toBe(100);

    const over = describeGenerationUsage(25, cap);
    expect(over.level).toBe("exhausted");
    expect(over.remaining).toBe(0);
    expect(over.pct).toBe(100); // clamped, never > 100
  });
});

describe("describeGenerationUsage — threshold scales with cap", () => {
  it("a large cap (90) uses a 10% window, not a fixed count", () => {
    // threshold = ceil(90 * 0.1) = 9.
    expect(describeGenerationUsage(80, 90).level).toBe("ok"); // remaining 10
    expect(describeGenerationUsage(81, 90).level).toBe("low"); // remaining 9
    expect(describeGenerationUsage(90, 90).level).toBe("exhausted");
  });

  it("a tiny cap (5) still warns before zero (min threshold 2)", () => {
    expect(describeGenerationUsage(2, 5).level).toBe("ok"); // remaining 3
    expect(describeGenerationUsage(3, 5).level).toBe("low"); // remaining 2
    expect(describeGenerationUsage(5, 5).level).toBe("exhausted");
  });
});

describe("describeGenerationUsage — defensive", () => {
  it("clamps negatives and non-finite input", () => {
    expect(describeGenerationUsage(-5, 20)).toMatchObject({ used: 0, level: "ok" });
    expect(describeGenerationUsage(Number.NaN, 20).used).toBe(0);
  });

  it("a zero cap (unpaid) is exhausted (the UI gates this to onboarding)", () => {
    expect(describeGenerationUsage(0, 0).level).toBe("exhausted");
  });
});
