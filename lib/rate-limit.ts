/**
 * Minimal in-process fixed-window rate limiter for low-stakes PUBLIC endpoints
 * — e.g. anonymous quiz-attempt logging — where a full DB-backed limit
 * (lib/usage.ts) would be overkill and add a database round-trip to a hot path.
 *
 * Keyed by an arbitrary string (typically the client IP). Returns true when the
 * caller is OVER the limit for the current window and should be blocked.
 *
 * Caveat — this is deliberately lightweight, not bulletproof: state is
 * per-process, so on serverless it is per-warm-instance and resets on a cold
 * start, and the fixed window allows a brief 2x burst at a window boundary.
 * That's an accepted trade-off here: it cheaply stops a naive single-client
 * spam loop (which keeps hitting the same warm instance) with no DB load. For
 * strong, cross-instance guarantees use the DB-backed limiters in lib/usage.ts.
 */
interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

export function isRateLimited(
  key: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic sweep so a flood of distinct keys can't grow the map
    // without bound. Cheap and amortised — only runs once it's already large.
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) {
        if (now >= b.resetAt) buckets.delete(k);
      }
    }
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}
