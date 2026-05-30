/**
 * Spaced repetition — an SM-2-derived scheduler (the algorithm behind Anki /
 * SuperMemo), adapted to a binary correct/incorrect grade and day-level
 * granularity that suits exam-season cramming.
 *
 * The idea: a question you got wrong comes back today; once you start getting
 * it right, the gap before it returns grows (1 day → 3 → interval × ease …),
 * so you spend your time on what you're about to forget instead of re-drilling
 * what you already know. Miss it again and it collapses back to "due now" and
 * gets a touch harder (lower ease) so it shows up more often.
 *
 * Pure and deterministic (pass `now` in) so the whole schedule is unit-tested
 * without clocks.
 */

export interface SrState {
  /** Ease factor — how fast the interval grows. Starts 2.5, floored at 1.3
   *  (SM-2's classic floor) so a stubborn card can't grow uncontrollably. */
  ease: number;
  /** Current review interval in whole days. */
  intervalDays: number;
  /** Consecutive correct reviews. Resets to 0 on a miss. */
  reps: number;
  /** Epoch ms when this card is next due. */
  dueAt: number;
}

const DAY_MS = 86_400_000;
const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

/** A freshly-missed question: due immediately, default ease, no reps yet. */
export function freshSrState(now = Date.now()): SrState {
  return { ease: 2.5, intervalDays: 0, reps: 0, dueAt: now };
}

/**
 * Advance a card's schedule after a drill answer.
 *   correct  → reps++, interval grows (1, 3, then ×ease), ease nudges up,
 *              next due `interval` days out.
 *   incorrect→ a lapse: reps reset, ease drops 0.2 (floored), due again now.
 */
export function scheduleNext(
  state: SrState,
  correct: boolean,
  now = Date.now(),
): SrState {
  if (!correct) {
    return {
      ease: clampEase(state.ease - 0.2),
      intervalDays: 0,
      reps: 0,
      dueAt: now, // relearn immediately
    };
  }

  const reps = state.reps + 1;
  let intervalDays: number;
  if (reps === 1) {
    intervalDays = 1;
  } else if (reps === 2) {
    intervalDays = 3;
  } else {
    // Grow from the PREVIOUS interval (min 1 so a card that lapsed to 0 still
    // advances) by the ease factor.
    intervalDays = Math.max(1, Math.round(state.intervalDays * state.ease));
  }
  const ease = clampEase(state.ease + 0.05);
  return { ease, intervalDays, reps, dueAt: now + intervalDays * DAY_MS };
}

/** Is this card due for review at `now`? */
export function isDue(state: SrState, now = Date.now()): boolean {
  return state.dueAt <= now;
}

/**
 * Decide what a persistence layer should do with a stored card after a drill
 * answer: advance its schedule, or — if a correct answer pushed its interval
 * past the graduation threshold — retire it from the backlog entirely.
 *
 * Pure so the DB-backed grade handler's branching (update vs delete) is
 * unit-tested without standing up a database. `retire` carries through the
 * `next` state even when retiring so callers that prefer to keep a tombstone
 * row (rather than delete) still have the final schedule to write.
 */
export function planReviewUpdate(
  state: SrState,
  correct: boolean,
  now = Date.now(),
  thresholdDays = 21,
): { retire: boolean; next: SrState } {
  const next = scheduleNext(state, correct, now);
  return { retire: correct && isGraduated(next, thresholdDays), next };
}

/**
 * Has this card been learned well enough to leave the active backlog? Once the
 * interval reaches the threshold (default 21 days), the student reliably knows
 * it — keeping it in the drill would just waste their time.
 */
export function isGraduated(state: SrState, thresholdDays = 21): boolean {
  return state.intervalDays >= thresholdDays;
}

function clampEase(ease: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, ease));
}
