/**
 * Client-side "is this visitor probably in India?" detection.
 *
 * Why this exists: the server-side approach (the x-vercel-ip-country header)
 * only works on a deployed Vercel instance — it's absent in local dev and on
 * any other host, so currency guessing silently fell back to USD everywhere
 * but production. These browser signals exist on EVERY device, so the INR
 * display works in dev, on previews, and off-Vercel too.
 *
 * Two signals, OR'd together (either is a strong India indicator):
 *   - IANA timezone: India has a single zone, surfaced as "Asia/Kolkata" or
 *     the legacy alias "Asia/Calcutta". A timezone is far harder to get wrong
 *     than IP geolocation and doesn't need a network call.
 *   - BCP-47 language tags ending in "-IN" (en-IN, hi-IN, ta-IN, ...).
 *
 * Kept as a PURE function so it's unit-testable without a browser — the thin
 * `detectIndiaClient()` wrapper reads the real globals and delegates here.
 */
export function isIndiaLocale(
  timeZone: string | undefined,
  languages: readonly string[] | undefined,
): boolean {
  const tz = (timeZone ?? "").toLowerCase();
  if (tz === "asia/kolkata" || tz === "asia/calcutta") return true;

  for (const lang of languages ?? []) {
    // Region subtag is the part after the last "-"; match case-insensitively.
    const region = lang.split("-").pop()?.toUpperCase();
    if (region === "IN") return true;
  }
  return false;
}

/** Reads the browser's timezone + language list and asks isIndiaLocale.
 *  Returns false during SSR (no globals) — the caller seeds the initial
 *  value from the server header instead. */
export function detectIndiaClient(): boolean {
  if (typeof window === "undefined") return false;
  let timeZone: string | undefined;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }
  const languages =
    typeof navigator !== "undefined"
      ? (navigator.languages ?? (navigator.language ? [navigator.language] : []))
      : [];
  return isIndiaLocale(timeZone, languages);
}
