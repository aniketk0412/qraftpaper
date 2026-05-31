import { describe, expect, it } from "vitest";

import {
  COLLEGE_DEPTS,
  SCHOOL_BANDS,
  SCHOOL_GRADES,
  bandForGrade,
  deptById,
  subjectsForGrade,
  type DemoSubject,
} from "@/lib/demo-quizzes";
import type { Quiz } from "@/lib/types";

const DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);

/** Every authored quiz across both tracks, flattened for validation. */
function allQuizzes(): { where: string; quiz: Quiz }[] {
  const out: { where: string; quiz: Quiz }[] = [];
  for (const band of SCHOOL_BANDS) {
    for (const s of band.subjects) {
      out.push({ where: `school/${band.id}/${s.subject}`, quiz: s.quiz });
    }
  }
  for (const dept of COLLEGE_DEPTS) {
    for (const s of dept.subjects) {
      out.push({ where: `college/${dept.id}/${s.subject}`, quiz: s.quiz });
    }
  }
  return out;
}

describe("school catalog structure", () => {
  it("covers every supported class exactly once across the bands", () => {
    const covered = SCHOOL_BANDS.flatMap((b) => b.grades).sort((a, b) => a - b);
    expect(covered).toEqual(SCHOOL_GRADES);
    expect(new Set(covered).size).toBe(covered.length); // no overlaps
  });

  it("maps every class to a band with at least one subject", () => {
    for (const g of SCHOOL_GRADES) {
      const band = bandForGrade(g);
      expect(band, `class ${g}`).toBeDefined();
      expect(subjectsForGrade(g).length).toBeGreaterThan(0);
    }
  });

  it("uses unique subjects within each band", () => {
    for (const band of SCHOOL_BANDS) {
      const subjects = band.subjects.map((s) => s.subject);
      expect(new Set(subjects).size).toBe(subjects.length);
    }
  });
});

describe("college catalog structure", () => {
  it("has unique department ids, each with at least one subject", () => {
    const ids = COLLEGE_DEPTS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const dept of COLLEGE_DEPTS) {
      expect(dept.subjects.length).toBeGreaterThan(0);
    }
  });

  it("uses unique subjects within each department", () => {
    for (const dept of COLLEGE_DEPTS) {
      const subjects = dept.subjects.map((s) => s.subject);
      expect(new Set(subjects).size).toBe(subjects.length);
    }
  });

  it("deptById resolves known ids and rejects unknown ones", () => {
    expect(deptById("cse")?.label).toContain("Computer Science");
    expect(deptById("nope")).toBeUndefined();
  });
});

// A demo only works if it looks right — a malformed question or a wrong answer
// key is worse than no demo. Validate every authored quiz in both tracks.
describe("every authored quiz is well-formed", () => {
  for (const { where, quiz } of allQuizzes()) {
    it(`${where} has valid metadata + questions`, () => {
      expect(quiz.subject.trim()).not.toBe("");
      expect(quiz.subjectCode.trim()).not.toBe("");
      expect(quiz.title.trim()).not.toBe("");
      expect(quiz.durationMins).toBeGreaterThan(0);
      expect(quiz.questions.length).toBeGreaterThan(0);

      const seen = new Set<string>();
      for (const q of quiz.questions) {
        expect(q.id).toBeTruthy();
        expect(seen.has(q.id)).toBe(false);
        seen.add(q.id);

        expect(q.prompt.trim()).not.toBe("");
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.options.length).toBeLessThanOrEqual(6);
        expect(q.options.every((o) => o.trim() !== "")).toBe(true);
        expect(new Set(q.options).size).toBe(q.options.length);

        expect(Number.isInteger(q.correctIndex)).toBe(true);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);

        expect(q.unit.trim()).not.toBe("");
        expect(DIFFICULTIES.has(q.difficulty)).toBe(true);
        expect(q.explanation.trim()).not.toBe("");
      }
    });
  }
});

describe("subjectsForGrade", () => {
  it("returns the same subjects for every class in a band", () => {
    const c1 = subjectsForGrade(1).map((s: DemoSubject) => s.subject);
    const c5 = subjectsForGrade(5).map((s: DemoSubject) => s.subject);
    expect(c1).toEqual(c5); // both Primary
  });

  it("returns nothing for a class outside the supported range", () => {
    expect(subjectsForGrade(13)).toEqual([]);
    expect(subjectsForGrade(0)).toEqual([]);
  });
});
