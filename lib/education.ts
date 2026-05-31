/**
 * Education level + grade: the account-level "what are you studying" that we
 * capture at signup and lock down. Pure and client-safe (no DB / quiz content),
 * so the signup form, the settings change action and the dashboard all share
 * one source of truth — and the lock timing is unit-tested.
 *
 * The taxonomy intentionally mirrors the demo-quiz catalog (school classes
 * 1–12, the same college department ids), so a user's grade lines up with the
 * grade-matched samples we show them.
 */

export type EducationLevel = "school" | "college";

export const EDUCATION_LEVELS: { id: EducationLevel; label: string }[] = [
  { id: "school", label: "School" },
  { id: "college", label: "College / University" },
];

/** Selectable school classes. */
export const SCHOOL_CLASSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** Selectable college departments (ids match the demo-quiz catalog). */
export const COLLEGE_DEPARTMENTS: { id: string; label: string }[] = [
  { id: "cse", label: "Computer Science / IT" },
  { id: "ece", label: "Electronics & Communication" },
  { id: "mech", label: "Mechanical Engineering" },
  { id: "eee", label: "Electrical Engineering" },
  { id: "civil", label: "Civil Engineering" },
  { id: "math", label: "Mathematics & Statistics" },
  { id: "science", label: "Science (B.Sc)" },
  { id: "biotech", label: "Biotechnology" },
  { id: "pharmacy", label: "Pharmacy (B.Pharm)" },
  { id: "commerce", label: "Commerce (B.Com)" },
  { id: "management", label: "Management (BBA / MBA)" },
  { id: "law", label: "Law (LLB)" },
];

/** A grade can be changed at most once in this window. ~6 months. */
export const GRADE_CHANGE_COOLDOWN_DAYS = 182;
const DAY_MS = 86_400_000;

/** Is a (level, grade) pair one we recognise? Used to validate form input. */
export function isValidGrade(
  level: string | null | undefined,
  grade: string | null | undefined,
): level is EducationLevel {
  if (!grade) return false;
  if (level === "school") {
    return SCHOOL_CLASSES.some((c) => String(c) === grade);
  }
  if (level === "college") {
    return COLLEGE_DEPARTMENTS.some((d) => d.id === grade);
  }
  return false;
}

/** Human label for a stored grade, e.g. "Class 10" or "Computer Science / IT". */
export function describeGrade(
  level: string | null | undefined,
  grade: string | null | undefined,
): string | null {
  if (!isValidGrade(level, grade)) return null;
  if (level === "school") return `Class ${grade}`;
  return COLLEGE_DEPARTMENTS.find((d) => d.id === grade)?.label ?? null;
}

/**
 * Whether the user may change their grade now. Null `updatedAt` means it was
 * never set (e.g. a pre-existing account) → allowed. Otherwise it's allowed
 * only once the cooldown has elapsed since the last change.
 */
export function canChangeGrade(
  updatedAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!updatedAt) return true;
  return now.getTime() - updatedAt.getTime() >= GRADE_CHANGE_COOLDOWN_DAYS * DAY_MS;
}

/** The earliest date the grade can next be changed (after a change at `updatedAt`). */
export function nextGradeChangeAt(updatedAt: Date): Date {
  return new Date(updatedAt.getTime() + GRADE_CHANGE_COOLDOWN_DAYS * DAY_MS);
}
