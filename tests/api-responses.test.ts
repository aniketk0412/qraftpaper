import { describe, expect, it } from "vitest";

import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  paymentRequired,
  safeJson,
  serverError,
  tooManyRequests,
  unauthorized,
} from "@/lib/api-responses";

describe("api-responses", () => {
  it("unauthorized() defaults to 401 with the canonical message", async () => {
    const r = unauthorized();
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: "Unauthorized" });
  });

  it("forbidden() returns 403", async () => {
    const r = forbidden();
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ error: "Forbidden" });
  });

  it("badRequest() defaults to 400", async () => {
    const r = badRequest();
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "Invalid request body" });
  });

  it("badRequest(message) carries the override", async () => {
    const r = badRequest("Subject name is required");
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ error: "Subject name is required" });
  });

  it("notFound() returns 404", async () => {
    const r = notFound();
    expect(r.status).toBe(404);
  });

  it("conflict() returns 409 with the provided message", async () => {
    const r = conflict("Already exists");
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ error: "Already exists" });
  });

  it("paymentRequired() returns 402 for plan/usage blocks", async () => {
    const r = paymentRequired("Subscribe to continue");
    expect(r.status).toBe(402);
  });

  it("tooManyRequests() returns 429", async () => {
    const r = tooManyRequests("Slow down");
    expect(r.status).toBe(429);
  });

  it("serverError() returns 500", async () => {
    const r = serverError();
    expect(r.status).toBe(500);
  });
});

describe("safeJson", () => {
  it("returns the parsed body on a valid JSON request", async () => {
    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hello: "world" }),
    });
    expect(await safeJson<{ hello: string }>(req)).toEqual({ hello: "world" });
  });

  it("returns null when the body is not valid JSON", async () => {
    const req = new Request("https://example.com", {
      method: "POST",
      body: "not json at all",
    });
    expect(await safeJson(req)).toBeNull();
  });

  it("returns null on an empty body", async () => {
    const req = new Request("https://example.com", { method: "POST" });
    expect(await safeJson(req)).toBeNull();
  });
});
