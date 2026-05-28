import { describe, expect, it } from "vitest";

import {
  STARTER_BLUEPRINTS,
  newBlueprintId,
  paperConfigFromBlueprint,
  sectionsTotalMarks,
} from "@/lib/blueprints";

describe("sectionsTotalMarks", () => {
  it("sums marksPerQuestion * count across sections", () => {
    expect(
      sectionsTotalMarks([
        { title: "A", instruction: "x", marksPerQuestion: 2, count: 5 },
        { title: "B", instruction: "y", marksPerQuestion: 10, count: 3 },
      ]),
    ).toBe(40);
  });

  it("treats invalid numbers as zero", () => {
    expect(
      sectionsTotalMarks([
        {
          title: "A",
          instruction: "x",
          marksPerQuestion: Number.NaN,
          count: 5,
        },
      ]),
    ).toBe(0);
  });
});

describe("starter blueprints", () => {
  it("each starter's sections sum to its declared totalMarks", () => {
    for (const bp of STARTER_BLUEPRINTS) {
      expect(sectionsTotalMarks(bp.config.sections)).toBe(bp.config.totalMarks);
    }
  });
});

describe("paperConfigFromBlueprint", () => {
  it("produces a valid API config", () => {
    const cfg = paperConfigFromBlueprint(STARTER_BLUEPRINTS[0], "Data Structures");
    expect(cfg.course).toBe("Data Structures");
    expect(cfg.units).toEqual([]);
    expect(cfg.totalMarks).toBe(70);
    expect(cfg.sections.length).toBeGreaterThan(0);
  });
});

describe("newBlueprintId", () => {
  it("returns distinct, non-empty ids", () => {
    const a = newBlueprintId();
    const b = newBlueprintId();
    expect(a).toBeTruthy();
    expect(a).not.toBe(b);
  });
});
