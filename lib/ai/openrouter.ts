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
    defaultHeaders: {
      "HTTP-Referer": siteUrl,
      "X-Title": "QraftPaper",
    },
  });

  return client;
}
