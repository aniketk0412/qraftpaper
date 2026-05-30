import { describe, expect, it } from "vitest";

import { isSubjectProfile } from "@/lib/content-validation";
import type { SubjectProfile } from "@/lib/types";

function validProfile(): SubjectProfile {
  return {
    units: [
      { unit: "Unit I", title: "Basics", topics: ["Intro", "Terms"] },
      { unit: "Unit II", title: "Trees", topics: ["BST"] },
    ],
    questionBank: [
      { text: "Define a stack.", unit: "Unit I", type: "short", marks: 2 },
      { text: "Explain BST insertion.", unit: "Unit II", type: "descriptive" },
    ],
    formatBlueprint: {
      sections: [
        {
          title: "Section A",
          instruction: "Answer all.",
          marksPerQuestion: 2,
          count: 5,
        },
      ],
      totalMarks: 70,
      durationMins: 180,
      instructionStyle: "formal",
    },
    difficultyMix: { Easy: 30, Medium: 50, Hard: 20 },
  };
}

describe("isSubjectProfile", () => {
  it("accepts a well-formed profile", () => {
    expect(isSubjectProfile(validProfile())).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(isSubjectProfile(null)).toBe(false);
    expect(isSubjectProfile("nope")).toBe(false);
    expect(isSubjectProfile([])).toBe(false);
  });

  it("rejects a profile with ZERO units (the poison case)", () => {
    const p = validProfile();
    p.units = [];
    expect(isSubjectProfile(p)).toBe(false);
  });

  it("rejects a unit missing topics or with a non-string topic", () => {
    const p = validProfile();
    // @ts-expect-error intentionally malformed
    p.units[0].topics = [123];
    expect(isSubjectProfile(p)).toBe(false);
  });

  it("rejects a question-bank entry with an unknown type", () => {
    const p = validProfile();
    // @ts-expect-error intentionally malformed
    p.questionBank[0].type = "essay";
    expect(isSubjectProfile(p)).toBe(false);
  });

  it("allows an empty question bank (units are what matter for generation)", () => {
    const p = validProfile();
    p.questionBank = [];
    expect(isSubjectProfile(p)).toBe(true);
  });

  it("rejects a blueprint with no sections", () => {
    const p = validProfile();
    p.formatBlueprint.sections = [];
    expect(isSubjectProfile(p)).toBe(false);
  });

  it("rejects a blueprint section with a non-positive count", () => {
    const p = validProfile();
    p.formatBlueprint.sections[0].count = 0;
    expect(isSubjectProfile(p)).toBe(false);
  });

  it("rejects a non-numeric difficulty mix", () => {
    const p = validProfile();
    // @ts-expect-error intentionally malformed
    p.difficultyMix.Easy = "lots";
    expect(isSubjectProfile(p)).toBe(false);
  });

  it("rejects when formatBlueprint is missing entirely", () => {
    const p = validProfile();
    // @ts-expect-error intentionally malformed
    delete p.formatBlueprint;
    expect(isSubjectProfile(p)).toBe(false);
  });
});
