import type {
  PaperGenerationConfig,
  QuizGenerationConfig,
} from "@/lib/ai/generate";
import type { Difficulty } from "@/lib/types";

// Hard caps so a crafted request can't make the model produce an enormous
// paper/quiz (cost + reliability guard). Tunable here.
const MAX_QUIZ_QUESTIONS = 30;
const MAX_QUIZ_DURATION_MINS = 300;
const MAX_PAPER_SECTIONS = 8;
const MAX_QUESTIONS_PER_SECTION = 25;
const MAX_MARKS_PER_QUESTION = 100;
const MAX_PAPER_TOTAL_MARKS = 1000;
const MAX_PAPER_DURATION_MINS = 600;

function numberOrNull(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDifficultyMix(value: unknown): Record<Difficulty, number> {
  const input = value as Partial<Record<Difficulty, unknown>> | undefined;
  return {
    Easy: numberOrNull(input?.Easy) ?? 30,
    Medium: numberOrNull(input?.Medium) ?? 50,
    Hard: numberOrNull(input?.Hard) ?? 20,
  };
}

export function normalizeQuizConfig(
  config: Partial<QuizGenerationConfig> | undefined,
): QuizGenerationConfig | null {
  if (!config) return null;

  const questionCount = numberOrNull(config.questionCount);
  const durationMins = numberOrNull(config.durationMins);

  if (
    !questionCount ||
    !durationMins ||
    questionCount <= 0 ||
    durationMins <= 0
  ) {
    return null;
  }

  return {
    questionCount: Math.min(Math.round(questionCount), MAX_QUIZ_QUESTIONS),
    durationMins: Math.min(Math.round(durationMins), MAX_QUIZ_DURATION_MINS),
    difficultyMix: normalizeDifficultyMix(config.difficultyMix),
  };
}

export function normalizePaperConfig(
  config: Partial<PaperGenerationConfig> | undefined,
): PaperGenerationConfig | null {
  if (!config) return null;

  const totalMarks = numberOrNull(config.totalMarks);
  const durationMins = numberOrNull(config.durationMins);

  if (!totalMarks || !durationMins || totalMarks <= 0 || durationMins <= 0) {
    return null;
  }

  const sections = (
    Array.isArray(config.sections)
      ? config.sections
          .map((section) => ({
            title: String(section.title ?? "").trim().slice(0, 200),
            instruction: String(section.instruction ?? "").trim().slice(0, 400),
            marksPerQuestion: Math.min(
              numberOrNull(section.marksPerQuestion) ?? 0,
              MAX_MARKS_PER_QUESTION,
            ),
            count: Math.min(
              numberOrNull(section.count) ?? 0,
              MAX_QUESTIONS_PER_SECTION,
            ),
          }))
          .filter(
            (section) =>
              section.title &&
              section.instruction &&
              section.marksPerQuestion > 0 &&
              section.count > 0,
          )
      : []
  ).slice(0, MAX_PAPER_SECTIONS);

  if (sections.length === 0) return null;

  return {
    totalMarks: Math.min(totalMarks, MAX_PAPER_TOTAL_MARKS),
    durationMins: Math.min(durationMins, MAX_PAPER_DURATION_MINS),
    course: config.course?.trim(),
    examTitle: config.examTitle?.trim(),
    units: Array.isArray(config.units)
      ? config.units.map((unit) => ({
          unit: String(unit.unit ?? "").trim(),
          weight: numberOrNull(unit.weight) ?? 0,
        }))
      : [],
    sections,
    difficultyMix: normalizeDifficultyMix(config.difficultyMix),
  };
}
