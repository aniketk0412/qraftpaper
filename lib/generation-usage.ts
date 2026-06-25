/**
 * Pure helper deciding how a user's monthly generation usage should read — and,
 * critically, *when* to show a "running low / out — upgrade" nudge.
 *
 * The timing rule has to be exactly right (showing it too eagerly nags paying
 * users; showing it wrong is worse), so it lives here, isolated from any UI or
 * DB, and is unit-tested at every boundary.
 *
 * Levels:
 *   - "unlimited"  — defensive support for callers with no cap. Never nudges.
 *   - "ok"         — comfortably within the allowance.
 *   - "low"        — about 10% (or the last 2) left. Nudge.
 *   - "exhausted"  — none left this month. Nudge.
 */
export type UsageLevel = "unlimited" | "ok" | "low" | "exhausted";

export interface GenerationUsage {
  level: UsageLevel;
  used: number;
  /** Monthly cap; null = unlimited. */
  cap: number | null;
  /** Generations left; null = unlimited. */
  remaining: number | null;
  /** Percent of the cap used, 0–100 (0 for unlimited). */
  pct: number;
  /** Whether to surface an upgrade nudge (low or exhausted). */
  nudge: boolean;
}

export function describeGenerationUsage(
  used: number,
  cap: number | null,
): GenerationUsage {
  const u = Number.isFinite(used) ? Math.max(0, Math.floor(used)) : 0;

  // Unlimited/uncapped: never a cap, never a nudge.
  if (cap === null) {
    return { level: "unlimited", used: u, cap: null, remaining: null, pct: 0, nudge: false };
  }

  const c = Number.isFinite(cap) ? Math.max(0, Math.floor(cap)) : 0;
  const remaining = Math.max(0, c - u);
  const pct = c > 0 ? Math.min(100, Math.round((u / c) * 100)) : 100;

  // "Running low" = down to ~10% of the cap, but always at least the last 2 so
  // small plans still get a warning before they hit zero.
  const lowThreshold = Math.max(2, Math.ceil(c * 0.1));

  let level: UsageLevel;
  if (remaining <= 0) level = "exhausted";
  else if (remaining <= lowThreshold) level = "low";
  else level = "ok";

  return { level, used: u, cap: c, remaining, pct, nudge: level !== "ok" };
}
