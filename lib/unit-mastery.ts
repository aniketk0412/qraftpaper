/**
 * Per-unit mastery for the subject detail "map" — turns the spaced-repetition
 * drill data (question_reviews) into a per-syllabus-unit state a student can
 * scan: where am I weak, where am I solid, what haven't I tested yet.
 *
 * Pure: the page does the one grouped query, this folds it onto the profile's
 * units. Matching is lenient (a review row's `unit` may be stored as the unit
 * code OR its title depending on what the generator emitted), and a unit with
 * no review rows is honestly "untested" rather than guessed.
 */

export interface UnitReviewAgg {
  /** The unit string as stored on the review rows. */
  unit: string;
  /** Review cards for this unit. */
  total: number;
  /** Cards due now and not yet mastered — the "still weak" signal. */
  due: number;
  /** Cards whose interval has graduated them out (reliably known). */
  mastered: number;
}

export type UnitState = "untested" | "weak" | "improving" | "mastered";

export interface UnitMastery {
  unit: string;
  title: string;
  state: UnitState;
  /** 0–100 for the progress bar. */
  pct: number;
  due: number;
  total: number;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

export function buildUnitMastery(
  units: { unit: string; title: string }[],
  aggs: UnitReviewAgg[],
): UnitMastery[] {
  // Index aggregates by normalised unit string for lenient lookup.
  const byKey = new Map<string, UnitReviewAgg>();
  for (const a of aggs) byKey.set(norm(a.unit), a);

  return units.map(({ unit, title }) => {
    const agg = byKey.get(norm(unit)) ?? byKey.get(norm(title));
    if (!agg || agg.total === 0) {
      return { unit, title, state: "untested", pct: 0, due: 0, total: 0 };
    }

    const mastered = Math.min(agg.mastered, agg.total);
    const pct = Math.round((mastered / agg.total) * 100);
    let state: UnitState;
    if (agg.due > 0) state = "weak";
    else if (mastered >= agg.total) state = "mastered";
    else state = "improving";

    return { unit, title, state, pct, due: agg.due, total: agg.total };
  });
}

export interface MasterySummary {
  units: number;
  mastered: number;
  weak: number;
}

export function masterySummary(list: UnitMastery[]): MasterySummary {
  return {
    units: list.length,
    mastered: list.filter((u) => u.state === "mastered").length,
    weak: list.filter((u) => u.state === "weak").length,
  };
}
