/**
 * Exam-readiness — turns the signals we already track for a subject into ONE
 * honest number a student can watch climb: "how ready am I for this exam?".
 *
 * Design rules that keep it trustworthy (a fake number erodes trust faster than
 * no number):
 *   - It is a PURE function over data already loaded for the dashboard
 *     (DashboardSubject: masteryPct, quizzesTaken, papers, hasProfile) — so it
 *     adds ZERO queries and never slows the page.
 *   - Score is independent of the exam DATE. Readiness is readiness; the
 *     countdown/urgency is framed separately by the caller.
 *   - It rewards BOTH scoring well AND practising enough to trust that score.
 *     A 90% from a single quiz is "promising", not "ready" — so the number
 *     keeps a reason to come back and practise more (which is the point).
 */

export type ReadinessBand =
  | "setup" // no profile yet — nothing to measure
  | "starting" // set up, but no quiz taken yet
  | "building" // practising, not there yet
  | "solid" // in good shape
  | "ready"; // exam-ready

export interface ReadinessInputs {
  /** Has the subject profile been built from uploaded documents? */
  hasProfile: boolean;
  /** Average quiz score across attempts (0–100), or null if none taken. */
  masteryPct: number | null;
  /** Distinct quizzes the student has actually taken in this subject. */
  quizzesTaken: number;
  /** Papers generated for this subject (engagement / coverage proxy). */
  papersGenerated: number;
}

export interface Readiness {
  /** 0–100, or null when not measurable yet (no profile). */
  score: number | null;
  band: ReadinessBand;
  /** Short student-facing label for the band, e.g. "Exam-ready". */
  label: string;
  /** One honest, encouraging, actionable next step in the product's voice. */
  message: string;
}

const BAND_LABEL: Record<ReadinessBand, string> = {
  setup: "Not set up",
  starting: "Just starting",
  building: "Building up",
  solid: "Looking solid",
  ready: "Exam-ready",
};

function clamp(n: number, lo = 0, hi = 100): number {
  if (!Number.isFinite(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}

/** How many distinct quizzes it takes before we fully trust the score. */
const CONFIDENCE_QUIZZES = 5;

export function computeReadiness(input: ReadinessInputs): Readiness {
  if (!input.hasProfile) {
    return {
      score: null,
      band: "setup",
      label: BAND_LABEL.setup,
      message: "Add your syllabus and a past paper to start tracking readiness.",
    };
  }

  const taken = Number.isFinite(input.quizzesTaken)
    ? Math.max(0, Math.floor(input.quizzesTaken))
    : 0;
  const papers = Number.isFinite(input.papersGenerated)
    ? Math.max(0, Math.floor(input.papersGenerated))
    : 0;

  // No quiz yet → no performance signal. Readiness reflects setup + how much
  // material they've prepared, capped low so the number clearly says "you
  // haven't tested yourself yet".
  if (taken === 0 || input.masteryPct === null) {
    const score = clamp(8 + Math.min(papers, 4) * 3); // 8..20
    return {
      score,
      band: "starting",
      label: BAND_LABEL.starting,
      message: "Take a quiz to measure where you actually stand.",
    };
  }

  const perf = clamp(input.masteryPct); // 0..100
  // Confidence ramps from one quiz (0.2) to full trust at CONFIDENCE_QUIZZES.
  const confidence = Math.min(1, taken / CONFIDENCE_QUIZZES);
  // A strong score with little practice is discounted; practising lifts it
  // toward the raw average. So both better scores AND more reps raise readiness.
  const score = Math.round(perf * (0.55 + 0.45 * confidence));

  const band = bandFor(score);
  return { score, band, label: BAND_LABEL[band], message: messageFor(band) };
}

function bandFor(score: number): ReadinessBand {
  if (score < 25) return "starting";
  if (score < 55) return "building";
  if (score < 80) return "solid";
  return "ready";
}

function messageFor(band: ReadinessBand): string {
  switch (band) {
    case "starting":
      return "Early days — keep practising and watch this climb.";
    case "building":
      return "Good progress. More quizzes will push this up fast.";
    case "solid":
      return "You're in good shape. A few more quizzes locks it in.";
    case "ready":
      return "Exam-ready. Keep practising to stay sharp.";
    default:
      return "Take a quiz to measure where you stand.";
  }
}
