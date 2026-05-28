"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect } from "react";

/**
 * PostHog client. Loads only when both env vars are present, so previews and
 * local dev stay silent unless explicitly configured. Auto-tracks pageviews
 * via `useEffect` because the Next App Router doesn't fire full reloads.
 */
function setupPostHog() {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  if (!key) return;
  if (posthog.__loaded) return;
  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // we fire pageviews manually on route change
    capture_pageleave: true,
    person_profiles: "identified_only",
    autocapture: true,
  });
}

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || !posthog.__loaded) return;
    const url =
      searchParams && searchParams.toString().length > 0
        ? `${pathname}?${searchParams.toString()}`
        : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupPostHog();
  }, []);

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}
