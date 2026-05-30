import type { QuestionPaper } from "@/lib/types";

export interface PaperReconcileReport {
  /** Total marks the user asked for in the config. */
  requestedMarks: number;
  /** Total marks the generated questions actually sum to. */
  actualMarks: number;
  /** True when the AI's output didn't sum to the requested total — the
   *  header was corrected to the real sum. Surfaced for observability so
   *  we can see how often the model misses the target. */
  marksAdjusted: boolean;
  /** True when at least one question's `number` was wrong and got fixed. */
  renumbered: boolean;
  /** How far off the model was, signed (actual − requested). */
  marksDelta: number;
}

/**
 * Make a generated question paper internally honest before it's saved.
 *
 * LLMs are unreliable at numeric constraints: even when the prompt says
 * "ensure the total equals 70 and number questions sequentially," the model
 * routinely returns questions that sum to 68 or 73 and numbers them per-
 * section (1,2,3 / 1,2 / 1,2,3) instead of across the whole paper. The header
 * then prints "Maximum Marks: 70" over questions that don't add up — the core
 * deliverable silently contradicting itself.
 *
 * This pass guarantees two invariants, deterministically, with no extra AI
 * call:
 *
 *   1. `totalMarks` equals the actual sum of every question's marks. The
 *      printed total can never lie again — we trust the questions, not the
 *      requested number.
 *   2. Questions are numbered 1..N sequentially across sections in order, so
 *      "Q7" is always the seventh question regardless of how the model
 *      counted.
 *
 * Pure — returns a new paper plus a report describing what it had to fix.
 */
export interface ReconcileOptions {
  /** Renumber questions 1..N across sections. True at generation time (the
   *  model's numbering is untrusted); false on manual edits, where the user
   *  controls question order/numbering and we only want to keep the marks
   *  total honest. */
  renumber?: boolean;
}

export function reconcilePaper(
  paper: QuestionPaper,
  requestedMarks: number,
  options: ReconcileOptions = {},
): { paper: QuestionPaper; report: PaperReconcileReport } {
  const { renumber = true } = options;
  let actualMarks = 0;
  let counter = 0;
  let renumbered = false;

  const sections = paper.sections.map((section) => ({
    ...section,
    questions: section.questions.map((q) => {
      counter += 1;
      // Defensive: a non-numeric / negative marks value contributes 0 rather
      // than NaN-poisoning the whole total.
      const marks = Number.isFinite(q.marks) && q.marks > 0 ? q.marks : 0;
      actualMarks += marks;
      if (!renumber) return { ...q, marks };
      const number = String(counter);
      if (q.number !== number) renumbered = true;
      return { ...q, number, marks };
    }),
  }));

  const marksAdjusted = actualMarks !== requestedMarks;

  return {
    paper: { ...paper, sections, totalMarks: actualMarks },
    report: {
      requestedMarks,
      actualMarks,
      marksAdjusted,
      renumbered,
      marksDelta: actualMarks - requestedMarks,
    },
  };
}
