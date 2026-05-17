export type Difficulty = "Easy" | "Medium" | "Hard";

export interface PaperQuestion {
  id: string;
  number: string;
  text: string;
  marks: number;
  unit: string;
  difficulty: Difficulty;
  bloom: string;
}

export interface PaperSection {
  id: string;
  title: string;
  instruction: string;
  questions: PaperQuestion[];
}

export interface QuestionPaper {
  id: string;
  subject: string;
  subjectCode: string;
  course: string;
  examTitle: string;
  durationMins: number;
  totalMarks: number;
  sections: PaperSection[];
}

export interface UnitWeight {
  unit: string;
  title: string;
  weight: number;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  unit: string;
  difficulty: Difficulty;
  explanation: string;
}

export interface Quiz {
  id: string;
  subject: string;
  subjectCode: string;
  title: string;
  durationMins: number;
  questions: QuizQuestion[];
}

export interface SubjectProfile {
  units: { unit: string; title: string; topics: string[] }[];
  questionBank: {
    text: string;
    unit: string;
    type: "short" | "descriptive" | "long" | "mcq";
    marks?: number;
  }[];
  formatBlueprint: {
    sections: {
      title: string;
      instruction: string;
      marksPerQuestion: number;
      count: number;
    }[];
    totalMarks: number;
    durationMins: number;
    instructionStyle: string;
  };
  difficultyMix: { Easy: number; Medium: number; Hard: number };
}
