/**
 * The $1 "3-Day Pass" — a one-time, non-subscription trial. Unlike the Solo
 * subscription (whose lifecycle Lemon Squeezy tracks via subscription_* events),
 * the pass has no recurring billing object: we grant it on `order_created` for
 * the trial variant and let it lapse on a timestamp we own (`users.trialEndsAt`).
 *
 * Two invariants live here so they can't drift:
 *   1. An expired trial is indistinguishable from "unpaid" — see effectivePlan.
 *   2. A user gets the pass at most once — see `trialConsumedAt` (set on grant,
 *      never cleared; checked at checkout to refuse a re-buy).
 */
import { eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const TRIAL_PLAN_ID = "trial";
export const TRIAL_DURATION_DAYS = 3;
export const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

/** True once a trial plan has passed its end date (or has no end date set). */
export function isTrialExpired(
  plan: string,
  trialEndsAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (plan !== TRIAL_PLAN_ID) return false;
  return !trialEndsAt || trialEndsAt.getTime() <= now.getTime();
}

/**
 * The plan a user is *effectively* on right now. An expired 3-Day Pass collapses
 * to "unpaid"; every other plan passes through unchanged. Pure — safe to use for
 * both gating and display. For the DB-reconciling version, see loadEffectivePlan.
 */
export function effectivePlan(
  plan: string,
  trialEndsAt: Date | null | undefined,
  now: Date = new Date(),
): string {
  return isTrialExpired(plan, trialEndsAt, now) ? "unpaid" : plan;
}

/** The end date for a pass starting now (or at `start`). */
export function trialEndsFrom(start: Date = new Date()): Date {
  return new Date(start.getTime() + TRIAL_DURATION_MS);
}

/**
 * Reads the user's plan and transparently expires a lapsed 3-Day Pass: when the
 * trial has ended we write the downgrade back to the DB (so every display read
 * is correct afterwards) and return "unpaid". Use this at gate points
 * (generation, subject creation) where the JWT can't be trusted for entitlement.
 */
export async function loadEffectivePlan(userId: string): Promise<string> {
  const [row] = await getDb()
    .select({ plan: users.plan, trialEndsAt: users.trialEndsAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return "unpaid";

  const effective = effectivePlan(row.plan, row.trialEndsAt);
  if (effective !== row.plan) {
    // Lazy downgrade: the pass lapsed, so flip the stored plan to "unpaid" and
    // clear the end date. This is the only place an expired trial is reaped, so
    // a user who never returns simply keeps a stale "trial" row until they do —
    // harmless, because effectivePlan() treats it as unpaid everywhere.
    await getDb()
      .update(users)
      .set({ plan: effective, trialEndsAt: null })
      .where(eq(users.id, userId));
  }

  return effective;
}

export interface TrialGrantResult {
  granted: boolean;
  reason?: "already-consumed";
}

/**
 * Activate the 3-Day Pass for a user, enforcing one-time eligibility. Idempotent
 * delivery is handled upstream by the billingEvents dedupe; this guards against
 * a user ever holding two passes. Returns whether the grant was applied.
 */
export async function grantTrial(
  userId: string,
  now: Date = new Date(),
): Promise<TrialGrantResult> {
  const [row] = await getDb()
    .select({ trialConsumedAt: users.trialConsumedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return { granted: false };
  if (row.trialConsumedAt) return { granted: false, reason: "already-consumed" };

  await getDb()
    .update(users)
    .set({
      plan: TRIAL_PLAN_ID,
      status: "active",
      trialEndsAt: trialEndsFrom(now),
      trialConsumedAt: now,
    })
    .where(eq(users.id, userId));

  return { granted: true };
}

/** Revoke an active pass (e.g. on refund). `trialConsumedAt` is intentionally
 *  left set so a refunded pass can't be farmed for a second free run. */
export async function revokeTrial(userId: string): Promise<void> {
  await getDb()
    .update(users)
    .set({ plan: "unpaid", trialEndsAt: null })
    .where(eq(users.id, userId));
}

/** Whether this user is eligible to buy the 3-Day Pass: never consumed it and
 *  isn't already on a real plan. */
export async function isTrialEligible(userId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ plan: users.plan, trialConsumedAt: users.trialConsumedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!row) return false;
  if (row.trialConsumedAt) return false;
  return row.plan === "unpaid";
}
