import { PostHog } from "posthog-node";

/**
 * Server-side PostHog client for capturing critical conversion events from
 * server actions and API routes (signup, paper generated, subscription
 * activated). Lazily instantiated and silently no-ops when the API key is
 * absent, so dev / preview environments don't need a key to run.
 *
 * Client-side pageviews + UI events live in components/providers/posthog-provider.tsx.
 */
let client: PostHog | undefined;

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1, // serverless: flush after every event since the lambda may freeze
      flushInterval: 0,
    });
  }
  return client;
}

export async function trackEvent(input: {
  /** Stable user id (uuid) if known, otherwise a per-request anonymous id. */
  distinctId: string;
  event: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
}): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  ph.capture({
    distinctId: input.distinctId,
    event: input.event,
    properties: input.properties,
  });
  // In a serverless env we don't get a reliable shutdown hook, so explicitly
  // flush the buffered event before the function returns.
  try {
    await ph.flush();
  } catch {
    /* analytics must never block a real request */
  }
}

export async function identifyUser(input: {
  distinctId: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
}): Promise<void> {
  const ph = getClient();
  if (!ph) return;
  ph.identify({
    distinctId: input.distinctId,
    properties: input.properties,
  });
  try {
    await ph.flush();
  } catch {
    /* swallow */
  }
}
