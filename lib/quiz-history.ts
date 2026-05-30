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
 * Per-question wrong-answer log. Captures the questions a user got wrong
 * (with prompt + correct answer + their pick) so the dashboard can surface
 * a "drill your mistakes" prompt and a future per-unit weakness chart can
 * read from it.
 *
 * This is intentionally CLIENT-SIDE-ONLY for now — no migration, no
 * server round-trip per quiz. Trade-off: data lives per device, lost on
 * clear-cache, doesn't survive cross-browser. Acceptable today because
 * the same person tends to study from one device, and rebuilding from a
 * day of quizzes is cheap. When we eventually want unit-level mastery
 * across devices, this shape lifts cleanly into a `quiz_question_results`
 * table.
 */
export interface WrongAnswer {
  quizId: string;
  questionId: string;
  prompt: string;
  /** What the user picked. -1 if they ran out of time and never picked. */
  pickedIndex: number;
  correctIndex: number;
  unit: string;
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
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Append wrong-answer records. Newest first. We don't dedupe across
 * attempts of the same questionId — getting the same question wrong twice
 * is itself signal, and a future "drill" UI can prioritise repeat
 * offenders.
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

/** Count of distinct questions the user has gotten wrong but not yet
 *  retried correctly. Used by the dashboard nudge. */
export function unrevisitedWrongCount(): number {
  const wrongs = loadWrongAnswers();
  return new Set(wrongs.map((w) => `${w.quizId}::${w.questionId}`)).size;
}
