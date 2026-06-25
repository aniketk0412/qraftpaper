/**
 * Quiz "angles" — the lever that makes repeat quizzes for the same subject feel
 * genuinely different instead of a reshuffle of the same recall questions.
 *
 * Each angle is a cognitive STANCE the generator leans into for that quiz. We
 * rotate the angle by how many quizzes already exist for the subject, so a
 * student's 1st, 2nd, 3rd… quiz each take the NEXT angle — variety by
 * construction, not by luck. The chosen angle's `guidance` is injected into the
 * generation prompt; `label` is student-facing (surfaceable in the UI later).
 */
export interface QuizAngle {
  key: string;
  label: string;
  guidance: string;
}

export const QUIZ_ANGLES: QuizAngle[] = [
  {
    key: "applied",
    label: "Applied scenarios",
    guidance:
      "Lead with APPLICATION. Most questions should drop the student into a short, concrete scenario and ask them to apply a concept to it — not recall a definition. Make the scenarios specific and subject-relevant.",
  },
  {
    key: "misconception",
    label: "Misconception hunt",
    guidance:
      "Hunt MISCONCEPTIONS. Build each question around a mistake students commonly make: the tempting wrong answer should be the misconception itself, and the explanation must name exactly why it feels right but isn't.",
  },
  {
    key: "analysis",
    label: "Analyse & compare",
    guidance:
      "Lead with ANALYSIS. Favour compare-and-contrast, 'which statement is FALSE', interpret-this-result, and 'pick the best explanation among plausible ones' — questions that need reasoning, not memory.",
  },
  {
    key: "quantitative",
    label: "Work it out",
    guidance:
      "Lead with QUANTITATIVE reasoning where the subject allows: small calculations, estimates, and 'what happens to X if Y changes'. Distractors should reflect classic sign/arithmetic/units mistakes. Fall back to conceptual questions for non-numeric units.",
  },
  {
    key: "conceptual",
    label: "Core concepts",
    guidance:
      "Lead with deep CONCEPTUAL understanding. Focus on the 'why' behind each idea and on edge cases that separate real understanding from surface memorisation.",
  },
];

/**
 * Pick the angle for the next quiz of a subject. Rotates by the number of
 * quizzes already generated for that subject, so each successive quiz uses a
 * different angle (wrapping after the list is exhausted). Negative/garbage
 * counts are clamped to the first angle rather than throwing.
 */
export function pickQuizAngle(priorQuizCount: number): QuizAngle {
  const n = QUIZ_ANGLES.length;
  const safe = Number.isFinite(priorQuizCount)
    ? Math.max(0, Math.floor(priorQuizCount))
    : 0;
  return QUIZ_ANGLES[safe % n];
}
