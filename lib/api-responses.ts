import { NextResponse } from "next/server";
import type { ZodType } from "zod";

/**
 * Small response helpers so every route returns the same shape and status
 * codes for the same situation. The goal is twofold:
 *   1. Stop drift — without this, "Unauthorized" gets typed as 401 in five
 *      places and 403 in two, and the bug only surfaces when somebody adds
 *      a client-side error handler that branches on status.
 *   2. Make API surface area trivial to scan: one grep for `unauthorized(`
 *      finds every gated route.
 *
 * Body shape is always `{ error: string }` for failures and `{ ...data }`
 * for successes. We don't return wrapped `{ data: ... }` — flatter is easier
 * to consume from the client without aliasing.
 */

interface ErrorBody {
  error: string;
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json<ErrorBody>({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json<ErrorBody>({ error: message }, { status: 403 });
}

export function badRequest(message = "Invalid request body") {
  return NextResponse.json<ErrorBody>({ error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json<ErrorBody>({ error: message }, { status: 404 });
}

export function conflict(message: string) {
  return NextResponse.json<ErrorBody>({ error: message }, { status: 409 });
}

/** 402 Payment Required — used for plan/usage-cap blocks. Chosen over 403
 *  because clients can disambiguate "you must subscribe / upgrade" from
 *  "you tried to access someone else's resource." */
export function paymentRequired(message: string) {
  return NextResponse.json<ErrorBody>({ error: message }, { status: 402 });
}

/** 429 — rate-limit hits. */
export function tooManyRequests(message: string) {
  return NextResponse.json<ErrorBody>({ error: message }, { status: 429 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json<ErrorBody>({ error: message }, { status: 500 });
}

/** Wraps `request.json()` and returns the parsed value or null. We return
 *  null on failure instead of throwing so callers can early-return with a
 *  badRequest() helper at the call site, keeping the route's happy-path
 *  flat. */
export async function safeJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Parse a request body against a Zod schema. Returns a discriminated union so
 * the caller can branch flat:
 *
 *   const parsed = await parseJson(request, MySchema);
 *   if (!parsed.ok) return parsed.response;
 *   const { ... } = parsed.data;
 *
 * On JSON-decode failure we surface a generic 400 ("Invalid request body").
 * On schema failure we surface a 400 with the first issue's path + message,
 * which is enough for client-side debugging without leaking internals or
 * Zod's full error tree. We deliberately don't echo the user's input back
 * (which Zod does by default) — that's how reflected XSS sneaks into error
 * messages.
 */
export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<
  { ok: true; data: T } | { ok: false; response: NextResponse<ErrorBody> }
> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: badRequest() };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".");
    const message =
      issue?.message ?? "Invalid request body";
    return {
      ok: false,
      response: badRequest(path ? `${path}: ${message}` : message),
    };
  }
  return { ok: true, data: parsed.data };
}
