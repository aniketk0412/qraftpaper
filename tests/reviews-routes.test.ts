import { beforeEach, describe, expect, it, vi } from "vitest";

// The route handlers pull in NextAuth (`@/auth`) and the DB-backed review
// helpers (`@/lib/reviews`). Both are mocked so these tests exercise ONLY the
// HTTP contract — auth gating, input validation, and that the handler calls
// the right helper with the session user's id — with no database or real auth
// config in the loop.
const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

const recordMissedQuestions = vi.fn();
const getDueReviewCount = vi.fn();
const getDueReviews = vi.fn();
const applyReviewGrade = vi.fn();
vi.mock("@/lib/reviews", () => ({
  recordMissedQuestions: (...a: unknown[]) => recordMissedQuestions(...a),
  getDueReviewCount: (...a: unknown[]) => getDueReviewCount(...a),
  getDueReviews: (...a: unknown[]) => getDueReviews(...a),
  applyReviewGrade: (...a: unknown[]) => applyReviewGrade(...a),
}));

import { GET as getDueCount, POST as postReviews } from "@/app/api/reviews/route";
import { GET as getDue } from "@/app/api/reviews/due/route";
import { POST as postGrade } from "@/app/api/reviews/grade/route";

const SESSION = { user: { id: "user-123" } };

function post(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function validQuestion(overrides: Record<string, unknown> = {}) {
  return {
    quizId: "quiz-1",
    questionId: "q1",
    prompt: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctIndex: 1,
    unit: "Unit I",
    difficulty: "Easy",
    explanation: "Two plus two is four.",
    subjectCode: "MA-101",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getDueReviewCount.mockResolvedValue(0);
  recordMissedQuestions.mockResolvedValue(0);
  getDueReviews.mockResolvedValue({ questions: [], subjectCode: "MIX" });
  applyReviewGrade.mockResolvedValue({ graduated: false, found: true });
});

describe("POST /api/reviews", () => {
  it("401s an anonymous caller and never touches the DB", async () => {
    auth.mockResolvedValue(null);
    const res = await postReviews(
      post("http://t/api/reviews", { questions: [validQuestion()] }),
    );
    expect(res.status).toBe(401);
    expect(recordMissedQuestions).not.toHaveBeenCalled();
  });

  it("400s a malformed body", async () => {
    auth.mockResolvedValue(SESSION);
    const res = await postReviews(post("http://t/api/reviews", { questions: [] }));
    expect(res.status).toBe(400);
    expect(recordMissedQuestions).not.toHaveBeenCalled();
  });

  it("records cleaned questions scoped to the session user", async () => {
    auth.mockResolvedValue(SESSION);
    getDueReviewCount.mockResolvedValue(3);
    const res = await postReviews(
      post("http://t/api/reviews", { questions: [validQuestion()] }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recorded: 1, due: 3 });
    expect(recordMissedQuestions).toHaveBeenCalledWith("user-123", [
      expect.objectContaining({ questionId: "q1" }),
    ]);
  });

  it("drops a question whose correctIndex overflows its options", async () => {
    auth.mockResolvedValue(SESSION);
    const res = await postReviews(
      post("http://t/api/reviews", {
        questions: [
          validQuestion({ questionId: "ok" }),
          validQuestion({ questionId: "bad", options: ["a", "b"], correctIndex: 3 }),
        ],
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ recorded: 1 });
    const [, recorded] = recordMissedQuestions.mock.calls[0];
    expect(recorded).toHaveLength(1);
    expect(recorded[0].questionId).toBe("ok");
  });
});

describe("GET /api/reviews", () => {
  it("401s an anonymous caller", async () => {
    auth.mockResolvedValue(null);
    expect((await getDueCount()).status).toBe(401);
  });

  it("returns the due-count for the session user", async () => {
    auth.mockResolvedValue(SESSION);
    getDueReviewCount.mockResolvedValue(7);
    const res = await getDueCount();
    expect(await res.json()).toEqual({ due: 7 });
    expect(getDueReviewCount).toHaveBeenCalledWith("user-123");
  });
});

describe("GET /api/reviews/due", () => {
  it("401s an anonymous caller", async () => {
    auth.mockResolvedValue(null);
    expect((await getDue()).status).toBe(401);
  });

  it("returns quiz:null when nothing is due", async () => {
    auth.mockResolvedValue(SESSION);
    const res = await getDue();
    expect(await res.json()).toEqual({ quiz: null });
  });

  it("shapes due cards into a runnable drill quiz", async () => {
    auth.mockResolvedValue(SESSION);
    getDueReviews.mockResolvedValue({
      questions: [
        {
          id: "drill::quiz-1::q1",
          prompt: "Q?",
          options: ["a", "b"],
          correctIndex: 0,
          unit: "Unit I",
          difficulty: "Easy",
          explanation: "x",
        },
      ],
      subjectCode: "MA-101",
    });
    const res = await getDue();
    const body = await res.json();
    expect(body.quiz).toMatchObject({
      id: "drill",
      subjectCode: "MA-101",
      title: "Drill your mistakes",
    });
    expect(body.quiz.questions).toHaveLength(1);
  });
});

describe("POST /api/reviews/grade", () => {
  it("401s an anonymous caller and never grades", async () => {
    auth.mockResolvedValue(null);
    const res = await postGrade(
      post("http://t/api/reviews/grade", {
        quizId: "q",
        questionId: "x",
        correct: true,
      }),
    );
    expect(res.status).toBe(401);
    expect(applyReviewGrade).not.toHaveBeenCalled();
  });

  it("400s when `correct` is not a boolean", async () => {
    auth.mockResolvedValue(SESSION);
    const res = await postGrade(
      post("http://t/api/reviews/grade", {
        quizId: "q",
        questionId: "x",
        correct: "yes",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("grades scoped to the session user and returns the outcome", async () => {
    auth.mockResolvedValue(SESSION);
    applyReviewGrade.mockResolvedValue({ graduated: true, found: true });
    const res = await postGrade(
      post("http://t/api/reviews/grade", {
        quizId: "quiz-1",
        questionId: "q1",
        correct: true,
      }),
    );
    expect(await res.json()).toEqual({ graduated: true, found: true });
    expect(applyReviewGrade).toHaveBeenCalledWith(
      "user-123",
      "quiz-1",
      "q1",
      true,
    );
  });
});
