import { describe, expect, it } from "vitest";

import {
  normalizePaperConfig,
  normalizeQuizConfig,
} from "@/lib/generation-config";

describe("normalizeQuizConfig", () => {
  it("rejects missing/invalid config", () => {
    expect(normalizeQuizConfig(undefined)).toBeNull();
    expect(normalizeQuizConfig({ questionCount: 0, durationMins: 10 })).toBeNull();
    expect(
      normalizeQuizConfig({ questionCount: 10, durationMins: -5 }),
    ).toBeNull();
  });

  it("clamps an abusive questionCount and duration", () => {
    const cfg = normalizeQuizConfig({
      questionCount: 100_000,
      durationMins: 99_999,
    });
    expect(cfg?.questionCount).toBe(30);
    expect(cfg?.durationMins).toBe(300);
  });

  it("passes normal values through", () => {
    const cfg = normalizeQuizConfig({ questionCount: 10, durationMins: 20 });
    expect(cfg?.questionCount).toBe(10);
    expect(cfg?.durationMins).toBe(20);
  });
});

describe("normalizePaperConfig", () => {
  const section = {
    title: "Section A",
    instruction: "Answer all.",
    marksPerQuestion: 2,
    count: 5,
  };

  it("rejects config with no valid sections", () => {
    expect(
      normalizePaperConfig({ totalMarks: 70, durationMins: 180, sections: [] }),
    ).toBeNull();
  });

  it("clamps section count, per-section count, marks and duration", () => {
    const cfg = normalizePaperConfig({
      totalMarks: 999_999,
      durationMins: 999_999,
      sections: Array.from({ length: 50 }, () => ({
        ...section,
        count: 9999,
        marksPerQuestion: 9999,
      })),
    });
    expect(cfg).not.toBeNull();
    expect(cfg!.sections.length).toBeLessThanOrEqual(8);
    expect(cfg!.sections.every((s) => s.count <= 25)).toBe(true);
    expect(cfg!.sections.every((s) => s.marksPerQuestion <= 100)).toBe(true);
    expect(cfg!.totalMarks).toBeLessThanOrEqual(1000);
    expect(cfg!.durationMins).toBeLessThanOrEqual(600);
  });

  it("drops incomplete sections", () => {
    const cfg = normalizePaperConfig({
      totalMarks: 70,
      durationMins: 180,
      sections: [section, { ...section, instruction: "" }],
    });
    expect(cfg!.sections).toHaveLength(1);
  });
});
