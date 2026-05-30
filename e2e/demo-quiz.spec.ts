import { expect, test } from "@playwright/test";
import { exampleQuiz } from "../lib/demo-data";

/**
 * The public demo quiz (/demo/quiz) is the highest-intent "try before signup"
 * surface — it runs the real QuizRunner against the in-memory exampleQuiz with
 * no DB. We drive it off the same exampleQuiz data the page renders, so the
 * option selectors can never drift from the content.
 */
test.describe("demo quiz", () => {
  test("loads the runner with the first question", async ({ page }) => {
    await page.goto("/demo/quiz");
    await expect(page.getByText(/question 1 of/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: exampleQuiz.questions[0].prompt }),
    ).toBeVisible();
  });

  test("answering every question correctly reaches a perfect score", async ({
    page,
  }) => {
    await page.goto("/demo/quiz");

    for (let i = 0; i < exampleQuiz.questions.length; i++) {
      const q = exampleQuiz.questions[i];
      const correct = q.options[q.correctIndex];
      // Click the correct option by its exact text. getByText with exact
      // avoids matching a substring of another option.
      await page.getByText(correct, { exact: true }).first().click();

      const isLast = i === exampleQuiz.questions.length - 1;
      await page
        .getByRole("button", {
          name: isLast ? /see results/i : /next question/i,
        })
        .click();
    }

    // The finished state. We added a "Perfect score" header for a full mark;
    // the score reads N/N.
    const n = exampleQuiz.questions.length;
    await expect(page.getByText(/perfect score/i)).toBeVisible();
    await expect(
      page.getByText(new RegExp(`\\b${n}\\b\\s*/\\s*${n}`)),
    ).toBeVisible();

    // The review + retake affordances must be offered after finishing.
    await expect(
      page.getByRole("button", { name: /review answers/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /retake quiz/i }),
    ).toBeVisible();
  });

  test('"Review answers" opens the per-question breakdown', async ({ page }) => {
    await page.goto("/demo/quiz");

    // Answer the first question (correctly) then run the clock down isn't
    // necessary — just walk to the end quickly by picking the first option.
    for (let i = 0; i < exampleQuiz.questions.length; i++) {
      const q = exampleQuiz.questions[i];
      await page.getByText(q.options[0], { exact: true }).first().click();
      const isLast = i === exampleQuiz.questions.length - 1;
      await page
        .getByRole("button", {
          name: isLast ? /see results/i : /next question/i,
        })
        .click();
    }

    await page.getByRole("button", { name: /review answers/i }).click();
    // Review mode shows the "Reviewing" header and every question prompt.
    await expect(page.getByText(/reviewing/i)).toBeVisible();
    await expect(
      page.getByText(exampleQuiz.questions[0].prompt),
    ).toBeVisible();
  });
});
