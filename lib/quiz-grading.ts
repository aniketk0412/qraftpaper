import type { Quiz } from "@/lib/types";

/** Per-question grading result returned to the taker after they submit. */
export interface QuestionResult {
  correctIndex: number;
  explanation: string;
  correct: boolean;
}

export interface GradedQuiz {
  results: Record<string, QuestionResult>;
  score: number;
  total: number;
}

/**
 * Server-authoritative grading for a (possibly shared) quiz.
 *
 * The answer key never leaves the server until a taker submits — this is the
 * function that turns a map of {questionId: pickedIndex} into a score + the
 * reveal (correct index + explanation per answered question). Pulled out of the
 * route handler so the scoring rules are unit-tested without a DB:
 *
 *   - Only questions the taker actually answered appear in `results`. An
 *     omitted question is neither right nor wrong — it just doesn't count,
 *     so a partial submission scores only what was attempted.
 *   - An answer keyed to an id that isn't in the quiz is ignored (a tampered
 *     or stale client can't inflate the score with phantom questions).
 *   - `total` is always the quiz's full question count, so the score reads as
 *     "X out of the whole quiz", not "X out of what you happened to answer".
 */
export function gradeQuizAnswers(
  quiz: Quiz,
  answers: Record<string, number>,
): GradedQuiz {
  const results: Record<string, QuestionResult> = {};
  let score = 0;

  for (const question of quiz.questions) {
    if (!(question.id in answers)) continue;
    const correct = answers[question.id] === question.correctIndex;
    if (correct) score += 1;
    results[question.id] = {
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      correct,
    };
  }

  return { results, score, total: quiz.questions.length };
}
