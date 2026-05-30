import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression guards for the auth + id-validation gates on the ownership-scoped
 * routes. Every one of these gates returns BEFORE any `getDb()` call, so we
 * only mock `@/auth` — no database needed. The point is to fail loudly if
 * someone ever removes an auth check or the UUID guard (which would open an
 * IDOR or a Postgres-cast 500). The ownership WHERE-clause itself is verified
 * by code review; here we pin the pre-DB contract.
 */
const auth = vi.fn();
vi.mock("@/auth", () => ({ auth: () => auth() }));

import { PATCH as patchPaper, DELETE as deletePaper } from "@/app/api/papers/[id]/route";
import { DELETE as deleteQuiz } from "@/app/api/quizzes/[id]/route";
import { PATCH as patchSubject, DELETE as deleteSubject } from "@/app/api/subjects/[id]/route";

// A syntactically valid v4 UUID (version nibble 4, variant nibble 8) so it
// clears isUuid and the handler proceeds past the id guard to the next gate.
const UUID = "11111111-1111-4111-8111-111111111111";
const SESSION = { user: { id: "owner-1" } };

function params(id: string) {
  return { params: Promise.resolve({ id }) };
}

function jsonReq(body: unknown): Request {
  return new Request("http://t/x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** A request whose body is not valid JSON, to exercise the safeJson path. */
function brokenJsonReq(): Request {
  return new Request("http://t/x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ not json",
  });
}

beforeEach(() => vi.clearAllMocks());

describe("PATCH /api/papers/[id] gates", () => {
  it("401s an anonymous caller", async () => {
    auth.mockResolvedValue(null);
    const res = await patchPaper(jsonReq({ content: {} }), params(UUID));
    expect(res.status).toBe(401);
  });

  it("404s a non-UUID id (no Postgres cast)", async () => {
    auth.mockResolvedValue(SESSION);
    const res = await patchPaper(jsonReq({ content: {} }), params("not-a-uuid"));
    expect(res.status).toBe(404);
  });

  it("400s an unparseable body", async () => {
    auth.mockResolvedValue(SESSION);
    const res = await patchPaper(brokenJsonReq(), params(UUID));
    expect(res.status).toBe(400);
  });

  it("400s content that isn't a valid paper", async () => {
    auth.mockResolvedValue(SESSION);
    const res = await patchPaper(jsonReq({ content: { id: UUID } }), params(UUID));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/papers/[id] gates", () => {
  it("401s an anonymous caller", async () => {
    auth.mockResolvedValue(null);
    expect((await deletePaper(jsonReq({}), params(UUID))).status).toBe(401);
  });

  it("404s a non-UUID id", async () => {
    auth.mockResolvedValue(SESSION);
    expect((await deletePaper(jsonReq({}), params("nope"))).status).toBe(404);
  });
});

describe("DELETE /api/quizzes/[id] gates", () => {
  it("401s an anonymous caller", async () => {
    auth.mockResolvedValue(null);
    expect((await deleteQuiz(jsonReq({}), params(UUID))).status).toBe(401);
  });

  it("404s a non-UUID id", async () => {
    auth.mockResolvedValue(SESSION);
    expect((await deleteQuiz(jsonReq({}), params("nope"))).status).toBe(404);
  });
});

describe("PATCH /api/subjects/[id] gates", () => {
  it("401s an anonymous caller", async () => {
    auth.mockResolvedValue(null);
    const res = await patchSubject(jsonReq({ examDate: null }), params(UUID));
    expect(res.status).toBe(401);
  });

  it("404s a non-UUID id", async () => {
    auth.mockResolvedValue(SESSION);
    const res = await patchSubject(jsonReq({ examDate: null }), params("nope"));
    expect(res.status).toBe(404);
  });

  it("400s an unparseable body", async () => {
    auth.mockResolvedValue(SESSION);
    expect((await patchSubject(brokenJsonReq(), params(UUID))).status).toBe(400);
  });

  it("400s an invalid exam date", async () => {
    auth.mockResolvedValue(SESSION);
    const res = await patchSubject(
      jsonReq({ examDate: "not-a-date" }),
      params(UUID),
    );
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/subjects/[id] gates", () => {
  it("401s an anonymous caller", async () => {
    auth.mockResolvedValue(null);
    expect((await deleteSubject(jsonReq({}), params(UUID))).status).toBe(401);
  });

  it("404s a non-UUID id", async () => {
    auth.mockResolvedValue(SESSION);
    expect((await deleteSubject(jsonReq({}), params("nope"))).status).toBe(404);
  });
});
