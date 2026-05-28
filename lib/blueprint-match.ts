import type { PaperGenerationConfig } from "@/lib/ai/generate";
import type { Difficulty, QuestionPaper } from "@/lib/types";

// A dimension >= this score is considered a match (green); below it earns a
// mismatch flag. Tuned to allow tiny rounding drift but catch real gaps.
const OK_THRESHOLD = 85;

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

export interface BlueprintDimension {
  key: "marks" | "sections" | "questions" | "difficulty";
  label: string;
  target: string;
  actual: string;
  /** 0–100 closeness of actual vs requested blueprint. */
  score: number;
  ok: boolean;
}

export interface BlueprintMatch {
  /** 0–100 overall structural accuracy (mean of the dimension scores). */
  overall: number;
  dimensions: BlueprintDimension[];
  /** Human-readable descriptions of every structural gap found. */
  flags: string[];
}

/**
 * Closeness of two non-negative quantities as a 0–100 score. Exact match is
 * 100; the score is the smaller value as a fraction of the larger, so it is
 * symmetric (over- and under-shooting a target are penalised equally).
 */
function ratioScore(actual: number, target: number): number {
  if (target <= 0) return actual <= 0 ? 100 : 0;
  if (actual <= 0) return 0;
  const ratio = Math.min(actual, target) / Math.max(actual, target);
  return Math.round(ratio * 100);
}

function toPercentages(
  mix: Record<Difficulty, number>,
): Record<Difficulty, number> {
  const total = mix.Easy + mix.Medium + mix.Hard;
  if (total <= 0) return { Easy: 0, Medium: 0, Hard: 0 };
  return {
    Easy: (mix.Easy / total) * 100,
    Medium: (mix.Medium / total) * 100,
    Hard: (mix.Hard / total) * 100,
  };
}

/**
 * 0–100 agreement between two difficulty distributions, derived from the total
 * variation distance (half the summed absolute percentage-point differences).
 * Identical distributions score 100; fully disjoint ones score 0.
 */
function distributionScore(
  target: Record<Difficulty, number>,
  actual: Record<Difficulty, number>,
): number {
  const tvd =
    DIFFICULTIES.reduce(
      (sum, key) => sum + Math.abs(target[key] - actual[key]),
      0,
    ) / 2;
  return Math.round(Math.max(0, 100 - tvd));
}

function formatMix(mix: Record<Difficulty, number>): string {
  return DIFFICULTIES.map((key) => Math.round(mix[key])).join("/");
}

/**
 * Compares the question paper a user actually has against the blueprint they
 * requested at generation time. Pure logic — no I/O — so it is unit-testable
 * and can recompute live as the editor mutates the paper.
 */
export function evaluateBlueprintMatch(
  config: PaperGenerationConfig,
  paper: QuestionPaper,
): BlueprintMatch {
  const flags: string[] = [];
  const questions = paper.sections.flatMap((section) => section.questions);

  // --- Total marks --------------------------------------------------------
  const actualMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const marksScore = ratioScore(actualMarks, config.totalMarks);
  if (marksScore < OK_THRESHOLD) {
    const delta = actualMarks - config.totalMarks;
    flags.push(
      delta > 0
        ? `Paper is ${delta} mark${delta === 1 ? "" : "s"} over the ${config.totalMarks}-mark target.`
        : `Paper is ${-delta} mark${delta === -1 ? "" : "s"} under the ${config.totalMarks}-mark target.`,
    );
  }

  // --- Section count ------------------------------------------------------
  const targetSections = config.sections.length;
  const actualSections = paper.sections.length;
  const sectionScore = ratioScore(actualSections, targetSections);
  if (sectionScore < OK_THRESHOLD) {
    flags.push(
      `Blueprint asked for ${targetSections} section${targetSections === 1 ? "" : "s"}, paper has ${actualSections}.`,
    );
  }

  // --- Question count -----------------------------------------------------
  const targetQuestions = config.sections.reduce((sum, s) => sum + s.count, 0);
  const actualQuestions = questions.length;
  const questionScore = ratioScore(actualQuestions, targetQuestions);
  if (questionScore < OK_THRESHOLD) {
    flags.push(
      `Blueprint asked for ${targetQuestions} question${targetQuestions === 1 ? "" : "s"}, paper has ${actualQuestions}.`,
    );
  }

  // --- Difficulty distribution -------------------------------------------
  const targetMix = toPercentages(config.difficultyMix);
  const counts: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
  questions.forEach((q) => (counts[q.difficulty] += 1));
  const actualMix = toPercentages(counts);
  const difficultyScore = distributionScore(targetMix, actualMix);
  if (difficultyScore < OK_THRESHOLD) {
    flags.push(
      `Difficulty split is ${formatMix(actualMix)} (E/M/H) versus the requested ${formatMix(targetMix)}.`,
    );
  }

  // --- Per-section structure ---------------------------------------------
  // Compare each requested section to the paper section in the same slot so a
  // user can see exactly which part drifted from the blueprint.
  config.sections.forEach((wanted, index) => {
    const got = paper.sections[index];
    if (!got) {
      flags.push(`Section ${index + 1} ("${wanted.title}") is missing.`);
      return;
    }
    if (got.questions.length !== wanted.count) {
      flags.push(
        `"${got.title}" has ${got.questions.length} question${got.questions.length === 1 ? "" : "s"}, blueprint wanted ${wanted.count}.`,
      );
    }
  });

  const dimensions: BlueprintDimension[] = [
    {
      key: "marks",
      label: "Total marks",
      target: String(config.totalMarks),
      actual: String(actualMarks),
      score: marksScore,
      ok: marksScore >= OK_THRESHOLD,
    },
    {
      key: "sections",
      label: "Sections",
      target: String(targetSections),
      actual: String(actualSections),
      score: sectionScore,
      ok: sectionScore >= OK_THRESHOLD,
    },
    {
      key: "questions",
      label: "Questions",
      target: String(targetQuestions),
      actual: String(actualQuestions),
      score: questionScore,
      ok: questionScore >= OK_THRESHOLD,
    },
    {
      key: "difficulty",
      label: "Difficulty mix",
      target: formatMix(targetMix),
      actual: formatMix(actualMix),
      score: difficultyScore,
      ok: difficultyScore >= OK_THRESHOLD,
    },
  ];

  const overall = Math.round(
    dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length,
  );

  return { overall, dimensions, flags };
}
