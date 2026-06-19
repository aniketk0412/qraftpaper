/**
 * Best-effort client IP from a Request, mirroring the convention used in
 * auth.ts / the auth server actions. On Vercel the platform sets
 * x-forwarded-for (client first in the comma-separated list); x-real-ip is a
 * fallback. Returns null when neither is present (e.g. local dev) — callers
 * must treat a null IP as "can't rate-limit by IP" rather than a match.
 */
export function getClientIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null
  );
}
