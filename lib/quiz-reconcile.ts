import type { Quiz, QuizQuestion } from "@/lib/types";

export interface QuizReconcileReport {
  /** Questions the model returned. */
  generated: number;
  /** Valid questions kept after sanitising. */
  kept: number;
  /** Malformed questions dropped (bad options / unreachable answer). */
  dropped: number;
  /** Questions whose duplicate options were collapsed. */
  optionsDeduped: number;
  /** Questions trimmed off the end because the model over-produced past the
   *  requested count. */
  trimmed: number;
}

/**
 * Sanitise + salvage a generated quiz before it's saved.
 *
 * Two real failure modes this fixes:
 *
 *   1. ALL-OR-NOTHING REJECTION. isQuiz() uses `questions.every(...)`, so a
 *      single malformed question (e.g. a correctIndex pointing past the
 *      options) made the WHOLE quiz fail validation — the user burned a paid
 *      generation and got nothing, even if 9 of 10 questions were perfect.
 *      We now drop only the broken questions and keep the good ones.
 *
 *   2. DUPLICATE OPTIONS. The validator accepts an MCQ with two identical
 *      choices ("A) 5  B) 5  C) 10  D) 15") — a broken question. We dedupe
 *      options by trimmed value, and crucially re-map correctIndex by the
 *      correct option's VALUE so the right answer survives the dedupe even
 *      when it was the duplicated one.
 *
 * A question is dropped when it can't be made coherent: fewer than 2 distinct
 * options, or a correctIndex that never pointed at a real option.
 *
 * Pure — input is not mutated.
 */
export function reconcileQuiz(
  quiz: Quiz,
  requestedCount?: number,
): { quiz: Quiz; report: QuizReconcileReport } {
  const generated = quiz.questions.length;
  let optionsDeduped = 0;

  const valid: QuizQuestion[] = [];
  for (const q of quiz.questions) {
    const sanitised = sanitiseQuestion(q);
    if (!sanitised) continue;
    if (sanitised.options.length !== q.options.length) optionsDeduped += 1;
    valid.push(sanitised);
  }

  let kept = valid;
  let trimmed = 0;
  if (typeof requestedCount === "number" && requestedCount > 0 && kept.length > requestedCount) {
    trimmed = kept.length - requestedCount;
    kept = kept.slice(0, requestedCount);
  }

  return {
    quiz: { ...quiz, questions: kept },
    report: {
      generated,
      kept: kept.length,
      dropped: generated - valid.length,
      optionsDeduped,
      trimmed,
    },
  };
}

/** Returns a cleaned question, or null when it can't be salvaged. Defensive
 *  about runtime shape because the input came from parsed AI output. */
function sanitiseQuestion(q: QuizQuestion): QuizQuestion | null {
  if (!Array.isArray(q.options) || q.options.length < 2) return null;
  if (!q.options.every((o) => typeof o === "string")) return null;
  if (!Number.isInteger(q.correctIndex)) return null;

  // The value the correct index points at, BEFORE dedupe. If the index was
  // out of bounds this is undefined and the question is unsalvageable.
  const correctValue = q.options[q.correctIndex];
  if (typeof correctValue !== "string") return null;

  // Dedupe by trimmed value, preserving the first occurrence's original text.
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const opt of q.options) {
    const key = opt.trim();
    if (key.length === 0) continue; // blank option is noise
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(opt);
  }
  if (deduped.length < 2) return null;

  // Re-map the answer by value, so it survives dedupe even if the answer was
  // the duplicated option.
  const correctKey = correctValue.trim();
  const newIndex = deduped.findIndex((o) => o.trim() === correctKey);
  if (newIndex < 0) return null;

  return { ...q, options: deduped, correctIndex: newIndex };
}
