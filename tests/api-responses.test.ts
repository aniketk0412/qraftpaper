import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  parseJson,
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

describe("parseJson", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().int().min(0).max(120),
  });

  it("returns ok: true with typed data on valid input", async () => {
    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Anita", age: 21 }),
    });
    const result = await parseJson(req, schema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ name: "Anita", age: 21 });
    }
  });

  it("returns ok: false with a 400 response on invalid JSON", async () => {
    const req = new Request("https://example.com", {
      method: "POST",
      body: "not json",
    });
    const result = await parseJson(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
    }
  });

  it("returns ok: false with field path on schema mismatch", async () => {
    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Anita", age: -5 }),
    });
    const result = await parseJson(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      const body = (await result.response.json()) as { error: string };
      expect(body.error).toMatch(/^age:/);
    }
  });

  it("does not echo the user's value in the error message", async () => {
    // Reflected-XSS guard: even if Zod would print the offending value,
    // our helper must not surface it.
    const req = new Request("https://example.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "<script>", age: 1000 }),
    });
    const result = await parseJson(req, schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const body = (await result.response.json()) as { error: string };
      expect(body.error).not.toContain("<script>");
      expect(body.error).not.toContain("1000");
    }
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
