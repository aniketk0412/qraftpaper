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
  /** Questions whose options were re-ordered to balance the answer position. */
  optionsShuffled: number;
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
 * It also BALANCES THE ANSWER POSITION. LLMs cluster the correct answer at one
 * or two option slots; a student who notices "it's usually B" games the quiz
 * instead of learning it. We deterministically permute each question's options
 * (seeded by the question id, so it's reproducible and spreads the answer
 * across a quiz's distinct ids) and re-point correctIndex — skipping
 * order-sensitive questions ("All of the above", "Both A and C") where
 * shuffling would corrupt the meaning.
 *
 * Pure — input is not mutated.
 */
export function reconcileQuiz(
  quiz: Quiz,
  requestedCount?: number,
): { quiz: Quiz; report: QuizReconcileReport } {
  const generated = quiz.questions.length;
  let optionsDeduped = 0;
  let optionsShuffled = 0;

  const valid: QuizQuestion[] = [];
  for (const q of quiz.questions) {
    const sanitised = sanitiseQuestion(q);
    if (!sanitised) continue;
    if (sanitised.options.length !== q.options.length) optionsDeduped += 1;
    const { question: balanced, changed } = balanceAnswerPosition(sanitised);
    if (changed) optionsShuffled += 1;
    valid.push(balanced);
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
      optionsShuffled,
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

// Options whose meaning depends on their position — shuffling these would
// corrupt them ("All of the above" must stay last; "Both A and C" / "I and II"
// reference other slots by label). Conservative: a false positive just means we
// leave that question in its original order (never breaks it), so we err toward
// skipping.
const ORDER_SENSITIVE_OPTION =
  /\b(?:all|none|both|neither|either)\b|of the (?:above|following)|\boption\s*\d|\b(?:[a-d]|i{1,3}|iv|v|\d+)\s+and\s+(?:[a-d]|i{1,3}|iv|v|\d+)\b|\(\s*[a-d]\s*\)/i;

function isOrderSensitive(options: string[]): boolean {
  return options.some((o) => ORDER_SENSITIVE_OPTION.test(o));
}

// Deterministic 32-bit string hash (FNV-1a) → seed, so the permutation is
// reproducible and unit-testable without any global RNG.
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// Small seeded PRNG (mulberry32). Good enough to scatter answer positions.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seeded Fisher–Yates: returns the original indices in their new order.
function seededOrder(n: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * Re-order a question's options to spread the correct-answer position, keeping
 * correctIndex pointing at the same option. Skipped for 2-option and
 * order-sensitive questions, and reported as unchanged when the permutation
 * happens to be the identity.
 */
function balanceAnswerPosition(
  q: QuizQuestion,
): { question: QuizQuestion; changed: boolean } {
  if (q.options.length < 3) return { question: q, changed: false };
  if (isOrderSensitive(q.options)) return { question: q, changed: false };

  const order = seededOrder(q.options.length, hashString(q.id));
  if (order.every((orig, pos) => orig === pos)) {
    return { question: q, changed: false };
  }

  const options = order.map((i) => q.options[i]);
  const correctIndex = order.indexOf(q.correctIndex);
  return { question: { ...q, options, correctIndex }, changed: true };
}
