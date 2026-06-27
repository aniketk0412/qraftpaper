import OpenAI from "openai";

import { siteUrl } from "@/lib/site";

// Models are env-overridable so you can swap to a cheaper tool-capable model
// (e.g. Gemini Flash / GPT-4o-mini class) without a code change. Any model on
// OpenRouter that supports function/tool calling works as a drop-in here.
export const OPENROUTER_MODELS = {
  // Default to Haiku — much cheaper than Sonnet and reliable at the tool-calling
  // used here; the paper structure is enforced server-side regardless of model.
  // Override with a different tool-capable model (e.g. google/gemini-2.5-flash)
  // via env if you want different quality/cost.
  generation:
    process.env.OPENROUTER_GENERATION_MODEL ?? "anthropic/claude-haiku-4.5",
  extraction:
    process.env.OPENROUTER_EXTRACTION_MODEL ?? "anthropic/claude-haiku-4.5",
};

let client: OpenAI | undefined;

export function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required to initialize AI services");
  }

  client ??= new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    // Bound how long any single AI call can hang. The SDK defaults to a ~10-min
    // timeout with 2 retries, so a slow/stuck OCR, profile build or generation
    // could leave a synchronous upload/generation request hanging for minutes
    // before failing. 90s per attempt with one retry fails fast and clean while
    // still riding out a transient blip. Applies to every call through this
    // client (extraction, OCR, paper + quiz generation).
    timeout: 90_000,
    maxRetries: 1,
    defaultHeaders: {
      "HTTP-Referer": siteUrl,
      "X-Title": "QraftPaper",
    },
  });

  return client;
}
