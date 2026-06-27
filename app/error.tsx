"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Logo } from "@/components/logo";
import { GridBackdrop } from "@/components/landing/grid-backdrop";
import { GlowButton } from "@/components/ui/glow-button";

/**
 * Top-level error boundary. Catches any uncaught render/runtime error in the
 * route tree and renders a brand-consistent recovery screen instead of the
 * raw Next.js default. We log the error server-side via the console; we do
 * NOT show the message to the user (could leak internals).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error in browser/Vercel logs so it can be triaged.
    console.error("[app:error]", error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <GridBackdrop />
      <header className="px-5 py-5 sm:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center px-5 sm:px-8">
        <div className="mx-auto max-w-xl text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold/[0.1] text-gold ring-1 ring-gold/30">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <p className="mt-6 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
            Something went wrong
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-gradient sm:text-4xl">
            QraftPaper hit an unexpected error
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-fg-muted">
            Try again, or head back to the home page. If it keeps happening,
            we&apos;d like to know.
          </p>
          {error.digest && (
            <p className="mt-3 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
              Reference: {error.digest}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <GlowButton type="button" onClick={reset} size="md">
              <RotateCcw className="h-4 w-4" />
              Try again
            </GlowButton>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full glass px-5 py-2.5 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
