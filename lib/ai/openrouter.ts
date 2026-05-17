import OpenAI from "openai";

export const OPENROUTER_MODELS = {
  generation: "anthropic/claude-sonnet-4.6",
  extraction: "anthropic/claude-haiku-4.5",
} as const;

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
      "HTTP-Referer": "https://qraftpaper.app",
      "X-Title": "QraftPaper",
    },
  });

  return client;
}
