import { and, asc, eq, lt, lte, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { questionReviews } from "@/lib/db/schema";
import {
  freshSrState,
  planReviewUpdate,
  type SrState,
} from "@/lib/spaced-repetition";
import type { Difficulty, QuizQuestion } from "@/lib/types";

/** Cards beyond this interval (days) are mastered and excluded from review. */
const GRADUATED_DAYS = 21;
/** Default drill session size. */
const DEFAULT_DUE_LIMIT = 10;

/** A question the user missed — the snapshot we persist so it can be
 *  re-served even if the source quiz is later deleted. */
export interface MissedQuestion {
  quizId: string;
  questionId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  unit: string;
  difficulty: Difficulty;
  explanation: string;
  subjectCode: string;
}

type ReviewRow = typeof questionReviews.$inferSelect;

function srFromRow(row: ReviewRow): SrState {
  return {
    ease: row.ease,
    intervalDays: row.intervalDays,
    reps: row.reps,
    dueAt: row.dueAt.getTime(),
  };
}

/**
 * Upsert missed questions into the spaced-repetition table. A brand-new miss
 * enters with a fresh (due-now) schedule; missing a question that's already
 * tracked is a lapse — it re-surfaces (due now, reps reset) and its snapshot
 * is refreshed to the latest phrasing. Returns the number of rows touched.
 */
export async function recordMissedQuestions(
  userId: string,
  questions: MissedQuestion[],
): Promise<number> {
  if (questions.length === 0) return 0;
  const now = new Date();
  const fresh = freshSrState(now.getTime());

  await getDb()
    .insert(questionReviews)
    .values(
      questions.map((q) => ({
        userId,
        quizId: q.quizId,
        questionId: q.questionId,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        unit: q.unit,
        difficulty: q.difficulty,
        explanation: q.explanation,
        subjectCode: q.subjectCode,
        ease: fresh.ease,
        intervalDays: fresh.intervalDays,
        reps: fresh.reps,
        dueAt: now,
      })),
    )
    .onConflictDoUpdate({
      target: [
        questionReviews.userId,
        questionReviews.quizId,
        questionReviews.questionId,
      ],
      set: {
        // Refresh the snapshot to the latest phrasing...
        prompt: sql`excluded.prompt`,
        options: sql`excluded.options`,
        correctIndex: sql`excluded.correct_index`,
        unit: sql`excluded.unit`,
        explanation: sql`excluded.explanation`,
        // ...and treat the repeat miss as a lapse: due now, reps reset.
        reps: 0,
        intervalDays: 0,
        dueAt: now,
        updatedAt: now,
      },
    });

  return questions.length;
}

/** Reconstruct the drill question id the client/runner expects. */
function drillQuestionId(row: ReviewRow): string {
  return `drill::${row.quizId}::${row.questionId}`;
}

/** Cards due for review now (not yet graduated), most-overdue first. */
export async function getDueReviews(
  userId: string,
  limit = DEFAULT_DUE_LIMIT,
): Promise<{ questions: QuizQuestion[]; subjectCode: string }> {
  const now = new Date();
  const rows = await getDb()
    .select()
    .from(questionReviews)
    .where(
      and(
        eq(questionReviews.userId, userId),
        lte(questionReviews.dueAt, now),
        lt(questionReviews.intervalDays, GRADUATED_DAYS),
      ),
    )
    .orderBy(asc(questionReviews.dueAt))
    .limit(limit);

  const questions: QuizQuestion[] = rows.map((row) => ({
    id: drillQuestionId(row),
    prompt: row.prompt,
    options: row.options,
    correctIndex: row.correctIndex,
    unit: row.unit,
    difficulty: row.difficulty as Difficulty,
    explanation: row.explanation,
  }));

  return { questions, subjectCode: rows[0]?.subjectCode ?? "MIX" };
}

/** Count of cards due for review now. Drives the dashboard nudge. */
export async function getDueReviewCount(userId: string): Promise<number> {
  const now = new Date();
  const [row] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(questionReviews)
    .where(
      and(
        eq(questionReviews.userId, userId),
        lte(questionReviews.dueAt, now),
        lt(questionReviews.intervalDays, GRADUATED_DAYS),
      ),
    );
  return row?.n ?? 0;
}

/**
 * Apply a drill answer to a question's schedule. Correct advances the
 * interval (and, once mastered, deletes the row); incorrect lapses it back to
 * due-now. Returns whether the card graduated out.
 */
export async function applyReviewGrade(
  userId: string,
  quizId: string,
  questionId: string,
  correct: boolean,
): Promise<{ graduated: boolean; found: boolean }> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(questionReviews)
    .where(
      and(
        eq(questionReviews.userId, userId),
        eq(questionReviews.quizId, quizId),
        eq(questionReviews.questionId, questionId),
      ),
    )
    .limit(1);

  if (!row) return { graduated: false, found: false };

  const { retire, next } = planReviewUpdate(
    srFromRow(row),
    correct,
    Date.now(),
    GRADUATED_DAYS,
  );

  if (retire) {
    await db.delete(questionReviews).where(eq(questionReviews.id, row.id));
    return { graduated: true, found: true };
  }

  await db
    .update(questionReviews)
    .set({
      ease: next.ease,
      intervalDays: next.intervalDays,
      reps: next.reps,
      dueAt: new Date(next.dueAt),
      updatedAt: new Date(),
    })
    .where(eq(questionReviews.id, row.id));

  return { graduated: false, found: true };
}
