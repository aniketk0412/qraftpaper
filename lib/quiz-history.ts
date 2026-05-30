import type { Difficulty, Quiz, QuizQuestion } from "@/lib/types";

// Local, per-device record of quiz attempts (no DB / migration needed).
export interface QuizAttempt {
  quizId: string;
  title: string;
  subjectCode: string;
  score: number;
  total: number;
  takenAt: number;
}

const STORAGE_KEY = "qp-quiz-history";
const MAX_ATTEMPTS = 30;

export function loadQuizHistory(): QuizAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuizAttempt[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQuizAttempt(attempt: QuizAttempt): QuizAttempt[] {
  const next = [attempt, ...loadQuizHistory()].slice(0, MAX_ATTEMPTS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  return next;
}

/**
 * Per-question wrong-answer log. Captures the FULL question a user got wrong
 * — prompt, options, correct index, explanation — so the Drill page can
 * re-serve it as a real practice question (not just show a read-only
 * review). The dashboard surfaces a "drill your mistakes" prompt from the
 * distinct count.
 *
 * This is intentionally CLIENT-SIDE-ONLY for now — no migration, no
 * server round-trip per quiz. Trade-off: data lives per device, lost on
 * clear-cache, doesn't survive cross-browser. Acceptable today because
 * the same person tends to study from one device. When we eventually want
 * unit-level mastery across devices, this shape lifts cleanly into a
 * `quiz_question_results` table — the fields already mirror QuizQuestion.
 */
export interface WrongAnswer {
  quizId: string;
  questionId: string;
  prompt: string;
  /** Full option set so the drill can re-render the question for retry. */
  options: string[];
  /** What the user picked. -1 if they ran out of time and never picked. */
  pickedIndex: number;
  correctIndex: number;
  unit: string;
  difficulty: Difficulty;
  explanation: string;
  subjectCode: string;
  takenAt: number;
}

const WRONG_KEY = "qp-wrong-answers";
const MAX_WRONG = 80;

export function loadWrongAnswers(): WrongAnswer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(WRONG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WrongAnswer[];
    if (!Array.isArray(parsed)) return [];
    // Defensive: older records (pre full-question capture) lack `options`.
    // Drop them rather than render a broken drill — they were captured by
    // an earlier build and can't be re-served. The user just re-earns them
    // on their next quiz.
    return parsed.filter(
      (w): w is WrongAnswer =>
        Array.isArray(w?.options) && w.options.length > 0,
    );
  } catch {
    return [];
  }
}

/**
 * Append wrong-answer records. Newest first. We don't dedupe across
 * attempts of the same questionId at write time — getting the same
 * question wrong twice is itself signal. Dedup happens at read time in
 * buildDrillQuiz so the drill never shows the same question twice.
 */
export function recordWrongAnswers(wrongs: WrongAnswer[]): WrongAnswer[] {
  if (wrongs.length === 0) return loadWrongAnswers();
  const next = [...wrongs, ...loadWrongAnswers()].slice(0, MAX_WRONG);
  try {
    window.localStorage.setItem(WRONG_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  return next;
}

/* ------------------------------------------------------------------ *
 *  Pure helpers — operate on arrays, no localStorage. Kept pure so the
 *  dedup + reconstruction logic is unit-testable without a DOM.
 * ------------------------------------------------------------------ */

/** Stable key for a wrong answer — a question is uniquely the (quiz,
 *  question) pair. */
export function wrongKey(w: Pick<WrongAnswer, "quizId" | "questionId">): string {
  return `${w.quizId}::${w.questionId}`;
}

/** Distinct count, given a list. Used by unrevisitedWrongCount + tests. */
export function distinctWrongCount(wrongs: WrongAnswer[]): number {
  return new Set(wrongs.map(wrongKey)).size;
}

/**
 * Collapse a wrong-answer list into a deduped set of distinct questions,
 * keeping the MOST RECENT record per (quiz, question) so we re-serve the
 * latest phrasing. Returns newest-first.
 */
export function dedupeWrongAnswers(wrongs: WrongAnswer[]): WrongAnswer[] {
  const seen = new Map<string, WrongAnswer>();
  for (const w of wrongs) {
    const k = wrongKey(w);
    const existing = seen.get(k);
    if (!existing || w.takenAt > existing.takenAt) {
      seen.set(k, w);
    }
  }
  return [...seen.values()].sort((a, b) => b.takenAt - a.takenAt);
}

export interface WeakUnit {
  unit: string;
  /** Distinct questions still missed in this unit. */
  count: number;
}

/**
 * Aggregate the wrong-answer backlog by unit, heaviest first. Drives the
 * "you keep missing Unit III" insight on the drill start screen. Pure —
 * dedupes by (quiz, question) first so a question missed twice doesn't
 * double-count its unit.
 */
export function weakUnits(wrongs: WrongAnswer[]): WeakUnit[] {
  const counts = new Map<string, number>();
  for (const w of dedupeWrongAnswers(wrongs)) {
    counts.set(w.unit, (counts.get(w.unit) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([unit, count]) => ({ unit, count }))
    .sort((a, b) => b.count - a.count || a.unit.localeCompare(b.unit));
}

/**
 * Reconstruct a runnable Quiz from a wrong-answer list. Pure — pass the
 * array in. Returns null when there's nothing to drill.
 *
 * `limit` caps the question count so a backlog of 80 doesn't become an
 * 80-question slog — 10 at a time is the right session size for a focused
 * drill (matches the default quiz length).
 */
export function buildDrillQuiz(
  wrongs: WrongAnswer[],
  limit = 10,
): Quiz | null {
  const deduped = dedupeWrongAnswers(wrongs).slice(0, limit);
  if (deduped.length === 0) return null;

  const questions: QuizQuestion[] = deduped.map((w) => ({
    // Encode the origin (quiz, question) into the drill question's id so the
    // DrillRunner can map a correct answer back to the right wrong-answer
    // record. We use "::" as the separator — it can't appear in a uuid or in
    // our question ids ("q5", "a1"), so parseDrillQuestionId can split on it
    // unambiguously regardless of how many hyphens the uuid contains.
    id: `drill::${w.quizId}::${w.questionId}`,
    prompt: w.prompt,
    options: w.options,
    correctIndex: w.correctIndex,
    unit: w.unit,
    difficulty: w.difficulty,
    explanation: w.explanation,
  }));

  // Subject code is whatever the majority of the drilled questions share;
  // a mixed-subject drill just shows the first one's code. Cosmetic only.
  const subjectCode = deduped[0]?.subjectCode ?? "MIX";

  return {
    id: "drill",
    subject: "Your missed questions",
    subjectCode,
    title: "Drill your mistakes",
    // 1 minute per question is generous — drilling is about getting it
    // right, not racing the clock.
    durationMins: deduped.length,
    questions,
  };
}

/* ------------------------------------------------------------------ *
 *  localStorage wrappers around the pure helpers.
 * ------------------------------------------------------------------ */

/** Count of distinct questions the user has gotten wrong but not yet
 *  retried correctly. Used by the dashboard nudge. */
export function unrevisitedWrongCount(): number {
  return distinctWrongCount(loadWrongAnswers());
}

/** Build a drill quiz straight from localStorage. null when empty. */
export function loadDrillQuiz(limit = 10): Quiz | null {
  return buildDrillQuiz(loadWrongAnswers(), limit);
}

/** Weak-unit breakdown straight from localStorage, heaviest first. */
export function loadWeakUnits(): WeakUnit[] {
  return weakUnits(loadWrongAnswers());
}

/**
 * Remove every record for one (quiz, question) — called when the user
 * finally answers that question correctly in a drill, closing the loop so
 * the dashboard count goes down. Returns the surviving records.
 */
export function clearWrongAnswer(
  quizId: string,
  questionId: string,
): WrongAnswer[] {
  const key = `${quizId}::${questionId}`;
  const next = loadWrongAnswers().filter((w) => wrongKey(w) !== key);
  try {
    window.localStorage.setItem(WRONG_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
  return next;
}

/**
 * Reverse the `drill::<quizId>::<questionId>` id encoding applied in
 * buildDrillQuiz back into the original (quizId, questionId) so the
 * DrillRunner can call clearWrongAnswer when an answer is correct.
 * Returns null for any id that isn't a drill id.
 */
export function parseDrillQuestionId(
  drillId: string,
): { quizId: string; questionId: string } | null {
  const parts = drillId.split("::");
  if (parts.length !== 3 || parts[0] !== "drill") return null;
  const [, quizId, questionId] = parts;
  if (!quizId || !questionId) return null;
  return { quizId, questionId };
}
