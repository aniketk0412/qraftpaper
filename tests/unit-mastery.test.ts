import { describe, expect, it } from "vitest";

import {
  buildUnitMastery,
  masterySummary,
  type UnitReviewAgg,
} from "@/lib/unit-mastery";

const UNITS = [
  { unit: "U1", title: "Processes & threads" },
  { unit: "U2", title: "CPU scheduling" },
  { unit: "U3", title: "Deadlock" },
];

describe("buildUnitMastery", () => {
  it("marks units with no review data as untested (no guessing)", () => {
    const out = buildUnitMastery(UNITS, []);
    expect(out).toHaveLength(3);
    expect(out.every((u) => u.state === "untested")).toBe(true);
    expect(out.every((u) => u.pct === 0)).toBe(true);
  });

  it("flags a unit with due cards as weak", () => {
    const aggs: UnitReviewAgg[] = [
      { unit: "U2", total: 5, due: 3, mastered: 1 },
    ];
    const u2 = buildUnitMastery(UNITS, aggs).find((u) => u.unit === "U2")!;
    expect(u2.state).toBe("weak");
    expect(u2.due).toBe(3);
  });

  it("marks a fully-graduated unit as mastered", () => {
    const aggs: UnitReviewAgg[] = [{ unit: "U1", total: 4, due: 0, mastered: 4 }];
    const u1 = buildUnitMastery(UNITS, aggs).find((u) => u.unit === "U1")!;
    expect(u1.state).toBe("mastered");
    expect(u1.pct).toBe(100);
  });

  it("marks partially-mastered, none-due units as improving", () => {
    const aggs: UnitReviewAgg[] = [{ unit: "U3", total: 4, due: 0, mastered: 2 }];
    const u3 = buildUnitMastery(UNITS, aggs).find((u) => u.unit === "U3")!;
    expect(u3.state).toBe("improving");
    expect(u3.pct).toBe(50);
  });

  it("matches review rows by unit TITLE too, not just the code", () => {
    const aggs: UnitReviewAgg[] = [
      { unit: "CPU scheduling", total: 2, due: 0, mastered: 2 },
    ];
    const u2 = buildUnitMastery(UNITS, aggs).find((u) => u.unit === "U2")!;
    expect(u2.state).toBe("mastered");
  });

  it("is case/whitespace-insensitive when matching", () => {
    const aggs: UnitReviewAgg[] = [
      { unit: "  u1  ", total: 1, due: 1, mastered: 0 },
    ];
    expect(buildUnitMastery(UNITS, aggs).find((u) => u.unit === "U1")!.state).toBe(
      "weak",
    );
  });
});

describe("masterySummary", () => {
  it("counts mastered and weak units", () => {
    const aggs: UnitReviewAgg[] = [
      { unit: "U1", total: 2, due: 0, mastered: 2 }, // mastered
      { unit: "U2", total: 3, due: 2, mastered: 0 }, // weak
    ];
    const s = masterySummary(buildUnitMastery(UNITS, aggs));
    expect(s).toEqual({ units: 3, mastered: 1, weak: 1 });
  });
});
