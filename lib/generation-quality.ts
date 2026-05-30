import type { PaperReconcileReport } from "@/lib/paper-reconcile";
import type { QuizReconcileReport } from "@/lib/quiz-reconcile";

/**
 * Quality gates that decide whether a generation was bad enough to be worth
 * one automatic retry. The reconcile passes already FIX internal consistency
 * (the paper total always matches its questions; the quiz only keeps valid
 * questions) — but they can't conjure marks or questions the model never
 * produced. When the model lands far from what was asked, a single retry is
 * usually cheaper than shipping a paper that's 40% short.
 *
 * Thresholds are deliberately loose: we only retry on EGREGIOUS misses, so the
 * extra AI call (and its latency + cost) fires rarely. A paper that's 8% off
 * is fine — exam papers aren't to-the-mark anyway; a paper that's 40% off is
 * not the structure the student asked for.
 *
 * Pure + tested; the routes own the actual retry loop and the "keep the better
 * of two attempts" choice.
 */

/** How far a generated paper's marks landed from the request, as a ratio of
 *  the request. 0 = exact, 0.4 = 40% off in either direction. */
export function paperMarksErrorRatio(report: PaperReconcileReport): number {
  const denom = Math.max(1, Math.abs(report.requestedMarks));
  return Math.abs(report.marksDelta) / denom;
}

/** Retry a paper only when it's egregiously off-target on total marks. */
export function shouldRetryPaper(
  report: PaperReconcileReport,
  threshold = 0.25,
): boolean {
  return paperMarksErrorRatio(report) > threshold;
}

/** Fraction of the requested question count that survived sanitising. */
export function quizSurvivalRatio(
  report: QuizReconcileReport,
  requestedCount: number,
): number {
  const denom = Math.max(1, requestedCount);
  return report.kept / denom;
}

/** Retry a quiz only when too few usable questions survived (the model
 *  produced a lot of junk, or far too few questions). */
export function shouldRetryQuiz(
  report: QuizReconcileReport,
  requestedCount: number,
  minSurvival = 0.6,
): boolean {
  return quizSurvivalRatio(report, requestedCount) < minSurvival;
}
