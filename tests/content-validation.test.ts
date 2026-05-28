import { describe, expect, it } from "vitest";

import { isQuestionPaper, isQuiz } from "@/lib/content-validation";
import { examplePaper, exampleQuiz } from "@/lib/demo-data";

describe("isQuestionPaper", () => {
  it("accepts a valid paper shape", () => {
    expect(isQuestionPaper(examplePaper)).toBe(true);
  });

  it("rejects empty or malformed paper content", () => {
    expect(isQuestionPaper({ ...examplePaper, sections: [] })).toBe(false);
    expect(
      isQuestionPaper({
        ...examplePaper,
        sections: [
          {
            ...examplePaper.sections[0],
            questions: [{ ...examplePaper.sections[0].questions[0], marks: -1 }],
          },
        ],
      }),
    ).toBe(false);
  });
});

describe("isQuiz", () => {
  it("accepts a valid quiz shape", () => {
    expect(isQuiz(exampleQuiz)).toBe(true);
  });

  it("rejects impossible answer keys and empty option sets", () => {
    expect(
      isQuiz({
        ...exampleQuiz,
        questions: [{ ...exampleQuiz.questions[0], correctIndex: 99 }],
      }),
    ).toBe(false);
    expect(
      isQuiz({
        ...exampleQuiz,
        questions: [{ ...exampleQuiz.questions[0], options: [] }],
      }),
    ).toBe(false);
  });
});
