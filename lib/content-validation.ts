import type {
  Difficulty,
  PaperQuestion,
  PaperSection,
  QuestionPaper,
  Quiz,
  QuizQuestion,
} from "@/lib/types";

const DIFFICULTIES = new Set<Difficulty>(["Easy", "Medium", "Hard"]);

const LIMITS = {
  shortText: 160,
  longText: 4_000,
  paperSections: 12,
  paperQuestions: 120,
  quizQuestions: 80,
  quizOptions: 6,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown, maxLength = LIMITS.longText): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isPositiveInteger(value: unknown, max = 10_000): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= max
  );
}

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && DIFFICULTIES.has(value as Difficulty);
}

function isPaperQuestion(value: unknown): value is PaperQuestion {
  if (!isRecord(value)) return false;
  return (
    isString(value.id, LIMITS.shortText) &&
    isString(value.number, LIMITS.shortText) &&
    isString(value.text) &&
    isPositiveInteger(value.marks, 100) &&
    isString(value.unit, LIMITS.shortText) &&
    isDifficulty(value.difficulty) &&
    isString(value.bloom, LIMITS.shortText)
  );
}

function isPaperSection(value: unknown): value is PaperSection {
  if (!isRecord(value) || !Array.isArray(value.questions)) return false;
  return (
    isString(value.id, LIMITS.shortText) &&
    isString(value.title, LIMITS.shortText) &&
    isString(value.instruction, 1_000) &&
    value.questions.length > 0 &&
    value.questions.length <= LIMITS.paperQuestions &&
    value.questions.every(isPaperQuestion)
  );
}

export function isQuestionPaper(value: unknown): value is QuestionPaper {
  if (!isRecord(value) || !Array.isArray(value.sections)) return false;
  const questionCount = value.sections.reduce(
    (sum, section) =>
      sum + (isRecord(section) && Array.isArray(section.questions) ? section.questions.length : 0),
    0,
  );

  return (
    isString(value.id, LIMITS.shortText) &&
    isString(value.subject, LIMITS.shortText) &&
    isString(value.subjectCode, LIMITS.shortText) &&
    isString(value.course, LIMITS.shortText) &&
    isString(value.examTitle, LIMITS.shortText) &&
    isPositiveInteger(value.durationMins, 600) &&
    isPositiveInteger(value.totalMarks, 1_000) &&
    value.sections.length > 0 &&
    value.sections.length <= LIMITS.paperSections &&
    questionCount > 0 &&
    questionCount <= LIMITS.paperQuestions &&
    value.sections.every(isPaperSection)
  );
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!isRecord(value) || !Array.isArray(value.options)) return false;
  return (
    isString(value.id, LIMITS.shortText) &&
    isString(value.prompt) &&
    value.options.length >= 2 &&
    value.options.length <= LIMITS.quizOptions &&
    value.options.every((option) => isString(option, 1_000)) &&
    typeof value.correctIndex === "number" &&
    Number.isInteger(value.correctIndex) &&
    value.correctIndex >= 0 &&
    value.correctIndex < value.options.length &&
    isString(value.unit, LIMITS.shortText) &&
    isDifficulty(value.difficulty) &&
    isString(value.explanation)
  );
}

export function isQuiz(value: unknown): value is Quiz {
  if (!isRecord(value) || !Array.isArray(value.questions)) return false;
  return (
    isString(value.id, LIMITS.shortText) &&
    isString(value.subject, LIMITS.shortText) &&
    isString(value.subjectCode, LIMITS.shortText) &&
    isString(value.title, LIMITS.shortText) &&
    isPositiveInteger(value.durationMins, 600) &&
    value.questions.length > 0 &&
    value.questions.length <= LIMITS.quizQuestions &&
    value.questions.every(isQuizQuestion)
  );
}
