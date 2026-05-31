"use client";

import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** The build id baked into THIS bundle (see next.config.ts). */
const CURRENT_BUILD = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
const POLL_MS = 5 * 60 * 1000;

/**
 * Tells a long-lived tab / installed PWA when a newer version has shipped, and
 * offers a one-tap refresh. Without this, an installed PWA keeps serving the
 * build it last loaded with no signal that anything changed.
 *
 * How it works: we poll /api/version (the live deployment's build id) and
 * compare it to the id this bundle was built with. A mismatch means a new
 * deploy is live → show the prompt. Polls on mount, on tab focus / becoming
 * visible, and every few minutes. No service worker, no caching layer.
 */
export function UpdatePrompt() {
  const [updateReady, setUpdateReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // In dev (or if the build id wasn't injected) there's nothing to compare.
    if (CURRENT_BUILD === "dev") return;

    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { version?: string };
        if (!cancelled && data.version && data.version !== CURRENT_BUILD) {
          setUpdateReady(true);
        }
      } catch {
        /* offline or transient — try again next tick */
      }
    }

    void check();
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(check, POLL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, []);

  if (!updateReady || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4"
    >
      <div className="flex items-center gap-3 rounded-full border border-violet/40 bg-canvas/95 py-2 pl-2 pr-2.5 shadow-xl ring-1 ring-violet/10 backdrop-blur-md">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet/15 text-violet-bright">
          <RefreshCw className="h-3.5 w-3.5" />
        </span>
        <p className="text-[0.82rem] font-medium text-fg">
          A new version is available
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-accent px-3.5 py-1.5 text-[0.78rem] font-medium text-on-accent transition-opacity hover:opacity-90"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update notice"
          className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-full text-fg-subtle",
            "transition-colors hover:bg-tint/[0.08] hover:text-fg",
          )}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
