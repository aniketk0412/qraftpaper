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
