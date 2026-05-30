import { describe, expect, it } from "vitest";

import {
  paperMarksErrorRatio,
  quizSurvivalRatio,
  shouldRetryPaper,
  shouldRetryQuiz,
} from "@/lib/generation-quality";
import type { PaperReconcileReport } from "@/lib/paper-reconcile";
import type { QuizReconcileReport } from "@/lib/quiz-reconcile";

function paperReport(
  requestedMarks: number,
  actualMarks: number,
): PaperReconcileReport {
  return {
    requestedMarks,
    actualMarks,
    marksAdjusted: requestedMarks !== actualMarks,
    renumbered: false,
    marksDelta: actualMarks - requestedMarks,
  };
}

function quizReport(generated: number, kept: number): QuizReconcileReport {
  return {
    generated,
    kept,
    dropped: generated - kept,
    optionsDeduped: 0,
    trimmed: 0,
  };
}

describe("paperMarksErrorRatio", () => {
  it("is 0 for an exact hit", () => {
    expect(paperMarksErrorRatio(paperReport(70, 70))).toBe(0);
  });

  it("is the absolute relative error in either direction", () => {
    expect(paperMarksErrorRatio(paperReport(100, 60))).toBeCloseTo(0.4);
    expect(paperMarksErrorRatio(paperReport(100, 140))).toBeCloseTo(0.4);
  });

  it("never divides by zero", () => {
    expect(Number.isFinite(paperMarksErrorRatio(paperReport(0, 5)))).toBe(true);
  });
});

describe("shouldRetryPaper", () => {
  it("does not retry a small miss (8% off)", () => {
    expect(shouldRetryPaper(paperReport(100, 92))).toBe(false);
  });

  it("retries an egregious miss (40% off)", () => {
    expect(shouldRetryPaper(paperReport(100, 60))).toBe(true);
  });

  it("respects the boundary (exactly at threshold does not retry)", () => {
    // 25% off, default threshold 0.25 -> not strictly greater -> no retry
    expect(shouldRetryPaper(paperReport(100, 75))).toBe(false);
    // 26% off -> retry
    expect(shouldRetryPaper(paperReport(100, 74))).toBe(true);
  });
});

describe("quizSurvivalRatio", () => {
  it("is kept / requested", () => {
    expect(quizSurvivalRatio(quizReport(10, 8), 10)).toBeCloseTo(0.8);
  });

  it("never divides by zero", () => {
    expect(Number.isFinite(quizSurvivalRatio(quizReport(0, 0), 0))).toBe(true);
  });
});

describe("shouldRetryQuiz", () => {
  it("does not retry when most questions survived", () => {
    expect(shouldRetryQuiz(quizReport(10, 9), 10)).toBe(false);
  });

  it("retries when fewer than 60% survived", () => {
    expect(shouldRetryQuiz(quizReport(10, 5), 10)).toBe(true);
  });

  it("treats exactly 60% as acceptable (boundary)", () => {
    expect(shouldRetryQuiz(quizReport(10, 6), 10)).toBe(false);
  });
});
