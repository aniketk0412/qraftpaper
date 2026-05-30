import { NextResponse } from "next/server";

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
