import { z } from "zod";

import type { MissedQuestion } from "@/lib/reviews";

/**
 * Input schemas + sanitiser for the spaced-repetition (`/api/reviews`) routes.
 *
 * Kept apart from the route handlers so the validation — the part with real
 * branching — can be unit-tested without standing up a server or a DB. The
 * route handlers are then thin: parse, sanitise, call the DB helper.
 */

/** A single missed question pushed up from the quiz runner. */
export const missedQuestionSchema = z.object({
  quizId: z.string().min(1).max(64),
  questionId: z.string().min(1).max(64),
  prompt: z.string().min(1).max(2_000),
  options: z.array(z.string().max(1_000)).min(2).max(6),
  correctIndex: z.number().int().min(0).max(5),
  unit: z.string().max(160),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  explanation: z.string().max(4_000),
  subjectCode: z.string().max(64),
});

/** Body of `POST /api/reviews`. */
export const missedSchema = z.object({
  questions: z.array(missedQuestionSchema).min(1).max(50),
});

/** Body of `POST /api/reviews/grade`. */
export const gradeSchema = z.object({
  quizId: z.string().min(1).max(64),
  questionId: z.string().min(1).max(64),
  correct: z.boolean(),
});

/**
 * Drop questions whose `correctIndex` points outside their `options` array.
 * The schema bounds each field independently (correctIndex ≤ 5, ≥ 2 options),
 * but a payload can still be internally inconsistent — e.g. correctIndex 3 with
 * only 2 options — which would persist an unanswerable card. Filter, don't
 * reject, so one malformed question can't sink an otherwise-valid batch.
 */
export function cleanMissedQuestions(
  questions: MissedQuestion[],
): MissedQuestion[] {
  return questions.filter((q) => q.correctIndex < q.options.length);
}
