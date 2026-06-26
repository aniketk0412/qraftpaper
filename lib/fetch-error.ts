/**
 * Safely turn a failed fetch Response into a user-facing message.
 *
 * The server's JSON `{ error }` is preferred, but an uncaught 500, a proxy
 * error, or a body-size rejection returns no JSON — and calling
 * `response.json()` on that throws the infamous "Failed to execute 'json' on
 * 'Response': Unexpected end of JSON input", which then *masks* the real
 * failure (the user sees a parser error, not "upload failed").
 *
 * This reads the body defensively (text first, then JSON.parse) and always
 * returns a sensible string — never throws — so callers can do:
 *
 *   if (!res.ok) throw new Error(await readErrorMessage(res, "Upload failed"));
 */
export async function readErrorMessage(
  response: Response,
  fallback = "Something went wrong",
): Promise<string> {
  try {
    const text = await response.text();
    if (text) {
      try {
        const body = JSON.parse(text) as { error?: unknown };
        if (typeof body.error === "string" && body.error.trim()) {
          return body.error;
        }
      } catch {
        /* body wasn't JSON — fall through to the generic message */
      }
    }
  } catch {
    /* body unreadable (network teardown, etc.) */
  }
  return `${fallback} (HTTP ${response.status}).`;
}
