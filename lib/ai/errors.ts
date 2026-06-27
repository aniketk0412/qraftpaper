/**
 * Classify errors coming back from the AI provider (OpenRouter, via the OpenAI
 * SDK). A 402 (out of credits), 429 (rate limited) or 5xx means the SERVICE is
 * unavailable — not that the user's input was bad. The UI should say "try again
 * later" for these, never blame the user's documents or settings (which sends
 * them on a wild goose chase while the real fix is topping up credits).
 */
export function isAiServiceUnavailable(error: unknown): boolean {
  const status = (error as { status?: unknown })?.status;
  if (typeof status !== "number") return false;
  return status === 402 || status === 429 || status >= 500;
}

export const AI_UNAVAILABLE_MESSAGE =
  "AI generation is temporarily unavailable — please try again in a little while.";
