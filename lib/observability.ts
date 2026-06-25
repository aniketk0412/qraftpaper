/**
 * Error-reporting seam — ONE integration point for unexpected errors, so an
 * error monitor (Sentry, Datadog, …) can be plugged in by editing one function
 * instead of touching every `catch` in the app.
 *
 * Until a monitoring backend is configured this emits a single structured
 * `console.error` line, which on Vercel lands in the function logs and stays
 * greppable. When you add Sentry, forward from `captureException` here and every
 * call site is instantly covered — no further edits.
 */

export interface ErrorContext {
  /** Where it happened, e.g. "generate:paper", "billing:webhook". */
  scope: string;
  /** The acting user, when known — for correlating reports across requests. */
  userId?: string;
  /** Extra structured detail (ids, status codes, …). Avoid PII. */
  extra?: Record<string, unknown>;
}

/**
 * Report an unexpected/handled error. Never throws — reporting must not break
 * the request path that called it.
 */
export function captureException(error: unknown, context: ErrorContext): void {
  try {
    const payload = {
      level: "error" as const,
      scope: context.scope,
      ...(context.userId ? { userId: context.userId } : {}),
      message: error instanceof Error ? error.message : String(error),
      ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
      ...context.extra,
    };
    // Single structured line today → function logs. Swap this body for a
    // Sentry/Datadog client call when one is configured (DSN gated), keeping
    // this console.error as the fallback when it isn't.
    console.error(`[capture] ${context.scope}`, payload);
  } catch {
    /* reporting must never throw */
  }
}
