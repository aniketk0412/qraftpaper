import { exampleQuiz } from "@/lib/demo-data";
import type { Quiz } from "@/lib/types";

/**
 * Catalog of hand-authored sample quizzes for the public "try before signup"
 * demo. The point: a Class-10 student and a B.Tech student should not both be
 * dropped into the same Data Structures quiz. The visitor first picks their
 * level and subject, and we serve a quiz that actually matches.
 *
 * Everything here is static and answer-keys-inline — the demo runs entirely
 * client-side with zero AI cost and no signup, so it can never burn credits or
 * hit the database. To add a subject, append a DemoQuizEntry; the picker and
 * the level/subject lists derive from this array automatically.
 */

export type DemoLevel = "school" | "college";

export interface DemoQuizEntry {
  level: DemoLevel;
  /** Display subject, e.g. "Mathematics". Unique within a level. */
  subject: string;
  /** Short stage tag shown under the subject, e.g. "Class 9–10". */
  stage: string;
  /** One-line hook describing what the quiz covers. */
  blurb: string;
  quiz: Quiz;
}

export const DEMO_LEVELS: {
  id: DemoLevel;
  label: string;
  blurb: string;
}[] = [
  { id: "school", label: "School", blurb: "Classes 6–12 board syllabus" },
  {
    id: "college",
    label: "College / University",
    blurb: "Undergraduate & professional courses",
  },
];

function quiz(
  meta: { subject: string; subjectCode: string; title: string; durationMins: number },
  questions: Quiz["questions"],
): Quiz {
  return { id: "demo", ...meta, questions };
}

export const DEMO_QUIZZES: DemoQuizEntry[] = [
  // ---- COLLEGE -----------------------------------------------------------
  {
    level: "college",
    subject: "Computer Science",
    stage: "Undergraduate",
    blurb: "Data structures & algorithms — trees, graphs, sorting, hashing.",
    quiz: exampleQuiz,
  },
  {
    level: "college",
    subject: "Mathematics",
    stage: "Undergraduate",
    blurb: "Calculus, linear algebra and probability fundamentals.",
    quiz: quiz(
      {
        subject: "Engineering Mathematics",
        subjectCode: "MATH-UG",
        title: "Calculus & Algebra Practice Quiz",
        durationMins: 15,
      },
      [
        {
          id: "q1",
          prompt: "What is the derivative of sin(x) with respect to x?",
          options: ["sin(x)", "cos(x)", "−sin(x)", "−cos(x)"],
          correctIndex: 1,
          unit: "Calculus",
          difficulty: "Easy",
          explanation: "d/dx sin(x) = cos(x) — a standard derivative.",
        },
        {
          id: "q2",
          prompt: "Evaluate the limit of sin(x)/x as x approaches 0.",
          options: ["0", "1", "∞", "Undefined"],
          correctIndex: 1,
          unit: "Calculus",
          difficulty: "Medium",
          explanation:
            "The standard limit lim(x→0) sin(x)/x = 1, the basis of differentiating trigonometric functions.",
        },
        {
          id: "q3",
          prompt: "A square matrix is invertible if and only if its determinant is…",
          options: ["Zero", "Non-zero", "Positive", "Equal to 1"],
          correctIndex: 1,
          unit: "Linear Algebra",
          difficulty: "Medium",
          explanation:
            "A matrix is invertible exactly when det ≠ 0; a zero determinant means the rows are linearly dependent.",
        },
        {
          id: "q4",
          prompt: "What is ∫ x dx?",
          options: ["x + C", "x²/2 + C", "2x + C", "1 + C"],
          correctIndex: 1,
          unit: "Calculus",
          difficulty: "Easy",
          explanation: "By the power rule for integration, ∫ xⁿ dx = xⁿ⁺¹/(n+1); for n=1 that is x²/2 + C.",
        },
        {
          id: "q5",
          prompt:
            "A fair six-sided die is rolled once. What is the probability of getting an even number?",
          options: ["1/6", "1/3", "1/2", "2/3"],
          correctIndex: 2,
          unit: "Probability",
          difficulty: "Easy",
          explanation:
            "Three of the six equally likely outcomes (2, 4, 6) are even, so the probability is 3/6 = 1/2.",
        },
        {
          id: "q6",
          prompt: "What is the derivative of eˣ?",
          options: ["x·eˣ⁻¹", "eˣ", "eˣ/x", "1"],
          correctIndex: 1,
          unit: "Calculus",
          difficulty: "Easy",
          explanation: "eˣ is its own derivative — the defining property of the natural exponential.",
        },
      ],
    ),
  },
  {
    level: "college",
    subject: "Physics",
    stage: "Undergraduate",
    blurb: "Mechanics and electromagnetism core concepts.",
    quiz: quiz(
      {
        subject: "Engineering Physics",
        subjectCode: "PHY-UG",
        title: "Mechanics & Electricity Practice Quiz",
        durationMins: 15,
      },
      [
        {
          id: "q1",
          prompt: "What is the SI unit of force?",
          options: ["Joule", "Newton", "Watt", "Pascal"],
          correctIndex: 1,
          unit: "Mechanics",
          difficulty: "Easy",
          explanation: "Force is measured in newtons (N), where 1 N = 1 kg·m/s².",
        },
        {
          id: "q2",
          prompt: "Newton's second law of motion is expressed as…",
          options: ["F = m/a", "F = ma", "F = m + a", "F = a/m"],
          correctIndex: 1,
          unit: "Mechanics",
          difficulty: "Easy",
          explanation: "The net force equals mass times acceleration: F = ma.",
        },
        {
          id: "q3",
          prompt: "According to Ohm's law, the voltage across a resistor equals…",
          options: ["I / R", "I × R", "R / I", "I + R"],
          correctIndex: 1,
          unit: "Electricity",
          difficulty: "Easy",
          explanation: "Ohm's law states V = IR — voltage is current times resistance.",
        },
        {
          id: "q4",
          prompt: "Which of these is a vector quantity?",
          options: ["Speed", "Mass", "Velocity", "Temperature"],
          correctIndex: 2,
          unit: "Mechanics",
          difficulty: "Medium",
          explanation:
            "Velocity has both magnitude and direction, making it a vector; speed, mass and temperature are scalars.",
        },
        {
          id: "q5",
          prompt:
            "The work done by a force acting perpendicular to the direction of motion is…",
          options: ["Maximum", "Zero", "Negative", "Infinite"],
          correctIndex: 1,
          unit: "Mechanics",
          difficulty: "Medium",
          explanation:
            "Work = F·d·cos θ. When the force is perpendicular, θ = 90°, cos 90° = 0, so the work is zero.",
        },
        {
          id: "q6",
          prompt: "The approximate acceleration due to gravity near Earth's surface is…",
          options: ["9.8 m/s²", "3 × 10⁸ m/s", "1.6 m/s²", "6.67 × 10⁻¹¹ m/s²"],
          correctIndex: 0,
          unit: "Mechanics",
          difficulty: "Easy",
          explanation: "g ≈ 9.8 m/s² at Earth's surface (1.6 m/s² is the Moon's).",
        },
      ],
    ),
  },
  // ---- SCHOOL ------------------------------------------------------------
  {
    level: "school",
    subject: "Mathematics",
    stage: "Class 9–10",
    blurb: "Algebra, geometry, mensuration and percentages.",
    quiz: quiz(
      {
        subject: "Mathematics",
        subjectCode: "MATH-10",
        title: "Class 9–10 Mathematics Quiz",
        durationMins: 12,
      },
      [
        {
          id: "q1",
          prompt: "Solve for x: 2x + 3 = 11.",
          options: ["2", "3", "4", "5"],
          correctIndex: 2,
          unit: "Algebra",
          difficulty: "Easy",
          explanation: "2x = 11 − 3 = 8, so x = 8 ÷ 2 = 4.",
        },
        {
          id: "q2",
          prompt: "What is the area of a circle of radius r?",
          options: ["2πr", "πr²", "πd", "r²"],
          correctIndex: 1,
          unit: "Mensuration",
          difficulty: "Easy",
          explanation: "Area of a circle = πr²; 2πr is its circumference.",
        },
        {
          id: "q3",
          prompt:
            "In a right-angled triangle with legs a, b and hypotenuse c, the Pythagoras theorem states…",
          options: ["a + b = c", "a² + b² = c²", "a² − b² = c²", "ab = c²"],
          correctIndex: 1,
          unit: "Geometry",
          difficulty: "Easy",
          explanation: "The square of the hypotenuse equals the sum of the squares of the other two sides.",
        },
        {
          id: "q4",
          prompt: "What is 15% of 200?",
          options: ["15", "30", "45", "20"],
          correctIndex: 1,
          unit: "Percentages",
          difficulty: "Easy",
          explanation: "15% of 200 = 0.15 × 200 = 30.",
        },
        {
          id: "q5",
          prompt: "The sum of the interior angles of a triangle is…",
          options: ["90°", "180°", "270°", "360°"],
          correctIndex: 1,
          unit: "Geometry",
          difficulty: "Easy",
          explanation: "The interior angles of any triangle always add up to 180°.",
        },
        {
          id: "q6",
          prompt: "Which of these is a prime number?",
          options: ["21", "27", "29", "33"],
          correctIndex: 2,
          unit: "Number Theory",
          difficulty: "Medium",
          explanation: "29 has no divisors other than 1 and itself; 21, 27 and 33 are all divisible by 3.",
        },
      ],
    ),
  },
  {
    level: "school",
    subject: "Science",
    stage: "Class 9–10",
    blurb: "Physics, chemistry and biology basics.",
    quiz: quiz(
      {
        subject: "Science",
        subjectCode: "SCI-10",
        title: "Class 9–10 Science Quiz",
        durationMins: 12,
      },
      [
        {
          id: "q1",
          prompt: "What is the chemical formula of water?",
          options: ["CO₂", "H₂O", "O₂", "NaCl"],
          correctIndex: 1,
          unit: "Chemistry",
          difficulty: "Easy",
          explanation: "Water is two hydrogen atoms bonded to one oxygen atom: H₂O.",
        },
        {
          id: "q2",
          prompt: "Which organelle is known as the 'powerhouse of the cell'?",
          options: ["Nucleus", "Ribosome", "Mitochondria", "Chloroplast"],
          correctIndex: 2,
          unit: "Biology",
          difficulty: "Easy",
          explanation: "Mitochondria produce most of the cell's energy (ATP) through respiration.",
        },
        {
          id: "q3",
          prompt: "Which gas do plants absorb from the air for photosynthesis?",
          options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
          correctIndex: 2,
          unit: "Biology",
          difficulty: "Easy",
          explanation: "Plants take in carbon dioxide and release oxygen during photosynthesis.",
        },
        {
          id: "q4",
          prompt: "What is the SI unit of electric current?",
          options: ["Volt", "Watt", "Ampere", "Ohm"],
          correctIndex: 2,
          unit: "Physics",
          difficulty: "Medium",
          explanation: "Electric current is measured in amperes (A).",
        },
        {
          id: "q5",
          prompt: "What is the pH of a neutral solution at room temperature?",
          options: ["0", "7", "14", "1"],
          correctIndex: 1,
          unit: "Chemistry",
          difficulty: "Easy",
          explanation: "A neutral solution such as pure water has a pH of 7; below 7 is acidic, above is basic.",
        },
        {
          id: "q6",
          prompt: "The approximate speed of light in vacuum is…",
          options: ["3 × 10⁸ m/s", "340 m/s", "9.8 m/s", "1.6 × 10⁶ m/s"],
          correctIndex: 0,
          unit: "Physics",
          difficulty: "Medium",
          explanation: "Light travels at about 3 × 10⁸ m/s (300,000 km/s) in vacuum; 340 m/s is the speed of sound in air.",
        },
      ],
    ),
  },
  {
    level: "school",
    subject: "English",
    stage: "Class 6–10",
    blurb: "Grammar, parts of speech and vocabulary.",
    quiz: quiz(
      {
        subject: "English",
        subjectCode: "ENG-10",
        title: "English Grammar Practice Quiz",
        durationMins: 10,
      },
      [
        {
          id: "q1",
          prompt: "Which of the following words is a noun?",
          options: ["Run", "Quickly", "Happiness", "Blue"],
          correctIndex: 2,
          unit: "Parts of Speech",
          difficulty: "Easy",
          explanation:
            "'Happiness' names a thing (a state), so it is a noun. 'Run' is a verb, 'quickly' an adverb, 'blue' an adjective.",
        },
        {
          id: "q2",
          prompt: "What is the past tense of the verb 'go'?",
          options: ["Goed", "Gone", "Went", "Going"],
          correctIndex: 2,
          unit: "Verbs",
          difficulty: "Easy",
          explanation: "'Go' is irregular: its simple past is 'went' ('gone' is the past participle).",
        },
        {
          id: "q3",
          prompt: "Choose the correct form: 'She ___ to school every day.'",
          options: ["go", "goes", "going", "gone"],
          correctIndex: 1,
          unit: "Subject–Verb Agreement",
          difficulty: "Easy",
          explanation: "A singular third-person subject ('She') takes 'goes' in the simple present tense.",
        },
        {
          id: "q4",
          prompt: "Which word is a synonym of 'happy'?",
          options: ["Sad", "Joyful", "Angry", "Tired"],
          correctIndex: 1,
          unit: "Vocabulary",
          difficulty: "Easy",
          explanation: "'Joyful' means full of joy — the closest in meaning to 'happy'.",
        },
        {
          id: "q5",
          prompt: "Identify the adjective in: 'The tall building collapsed.'",
          options: ["The", "Tall", "Building", "Collapsed"],
          correctIndex: 1,
          unit: "Parts of Speech",
          difficulty: "Medium",
          explanation: "'Tall' describes the noun 'building', so it is an adjective.",
        },
        {
          id: "q6",
          prompt: "Which punctuation mark ends a question?",
          options: ["Full stop", "Comma", "Question mark", "Exclamation mark"],
          correctIndex: 2,
          unit: "Punctuation",
          difficulty: "Easy",
          explanation: "A direct question ends with a question mark (?).",
        },
      ],
    ),
  },
];

/** Quizzes available for a given level, in catalog order. */
export function demoQuizzesForLevel(level: DemoLevel): DemoQuizEntry[] {
  return DEMO_QUIZZES.filter((entry) => entry.level === level);
}

/** Look up a specific demo quiz by level + subject. */
export function findDemoQuiz(
  level: DemoLevel,
  subject: string,
): DemoQuizEntry | undefined {
  return DEMO_QUIZZES.find(
    (entry) => entry.level === level && entry.subject === subject,
  );
}
