import type { Difficulty } from "@/lib/types";

export interface BlueprintSection {
  title: string;
  instruction: string;
  marksPerQuestion: number;
  count: number;
}

export interface BlueprintConfig {
  examTitle: string;
  totalMarks: number;
  durationMins: number;
  sections: BlueprintSection[];
  difficultyMix: Record<Difficulty, number>;
}

export interface Blueprint {
  id: string;
  name: string;
  description: string;
  builtIn?: boolean;
  config: BlueprintConfig;
}

const STORAGE_KEY = "qp-blueprints";

export const STARTER_BLUEPRINTS: Blueprint[] = [
  {
    id: "starter-end-sem",
    name: "End-Semester Examination",
    description: "Full-length paper across all units.",
    builtIn: true,
    config: {
      examTitle: "End-Semester Examination",
      totalMarks: 70,
      durationMins: 180,
      difficultyMix: { Easy: 30, Medium: 50, Hard: 20 },
      sections: [
        {
          title: "Section A — Short Answer",
          instruction: "Answer all questions. Each question carries 2 marks.",
          marksPerQuestion: 2,
          count: 5,
        },
        {
          title: "Section B — Descriptive",
          instruction:
            "Answer any three questions. Each question carries 10 marks.",
          marksPerQuestion: 10,
          count: 3,
        },
        {
          title: "Section C — Long Answer",
          instruction:
            "Answer any two questions. Each question carries 15 marks.",
          marksPerQuestion: 15,
          count: 2,
        },
      ],
    },
  },
  {
    id: "starter-mid-sem",
    name: "Mid-Semester Test",
    description: "Half-syllabus assessment.",
    builtIn: true,
    config: {
      examTitle: "Mid-Semester Test",
      totalMarks: 50,
      durationMins: 120,
      difficultyMix: { Easy: 40, Medium: 45, Hard: 15 },
      sections: [
        {
          title: "Section A — Short Answer",
          instruction: "Answer all questions. Each question carries 2 marks.",
          marksPerQuestion: 2,
          count: 5,
        },
        {
          title: "Section B — Descriptive",
          instruction:
            "Answer any four questions. Each question carries 10 marks.",
          marksPerQuestion: 10,
          count: 4,
        },
      ],
    },
  },
  {
    id: "starter-unit-test",
    name: "Unit Test",
    description: "Quick single-unit check.",
    builtIn: true,
    config: {
      examTitle: "Unit Test",
      totalMarks: 30,
      durationMins: 60,
      difficultyMix: { Easy: 50, Medium: 35, Hard: 15 },
      sections: [
        {
          title: "Section A — Short Answer",
          instruction: "Answer all questions. Each question carries 2 marks.",
          marksPerQuestion: 2,
          count: 5,
        },
        {
          title: "Section B — Descriptive",
          instruction:
            "Answer any two questions. Each question carries 10 marks.",
          marksPerQuestion: 10,
          count: 2,
        },
      ],
    },
  },
];

export function sectionsTotalMarks(sections: BlueprintSection[]): number {
  return sections.reduce(
    (sum, s) => sum + (Number(s.marksPerQuestion) || 0) * (Number(s.count) || 0),
    0,
  );
}

export function loadCustomBlueprints(): Blueprint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Blueprint[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(blueprints: Blueprint[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprints));
  } catch {
    /* storage unavailable */
  }
}

export function saveCustomBlueprint(blueprint: Blueprint): Blueprint[] {
  const existing = loadCustomBlueprints().filter((b) => b.id !== blueprint.id);
  const next = [{ ...blueprint, builtIn: false }, ...existing];
  persist(next);
  return next;
}

export function deleteCustomBlueprint(id: string): Blueprint[] {
  const next = loadCustomBlueprints().filter((b) => b.id !== id);
  persist(next);
  return next;
}

export function newBlueprintId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `bp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Build the request body config for POST /api/generate/paper. */
export function paperConfigFromBlueprint(
  blueprint: Blueprint,
  course: string,
) {
  return {
    totalMarks: blueprint.config.totalMarks,
    durationMins: blueprint.config.durationMins,
    course,
    examTitle: blueprint.config.examTitle,
    units: [],
    sections: blueprint.config.sections,
    difficultyMix: blueprint.config.difficultyMix,
  };
}
