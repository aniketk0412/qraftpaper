/**
 * Postgres error helpers. The Neon serverless driver surfaces the SQLSTATE on
 * `error.code`, so we can distinguish an expected constraint hit from a real
 * fault and return a clean status instead of a 500.
 */

/** SQLSTATE 23505 — unique_violation (a row tripped a UNIQUE constraint/index). */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}
