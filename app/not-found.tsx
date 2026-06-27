import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { Logo } from "@/components/logo";
import { GridBackdrop } from "@/components/landing/grid-backdrop";
import { GlowButton } from "@/components/ui/glow-button";

export const metadata: Metadata = {
  title: "Page not found — QraftPaper",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <GridBackdrop />
      <header className="px-5 py-5 sm:px-8">
        <Logo />
      </header>
      <main className="flex flex-1 items-center px-5 sm:px-8">
        <div className="mx-auto max-w-xl text-center">
          <span className="grid h-14 w-14 mx-auto place-items-center rounded-2xl bg-tint/[0.04] text-violet-bright ring-1 ring-line">
            <Compass className="h-6 w-6" />
          </span>
          <p className="mt-6 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
            404 · Page not found
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-gradient sm:text-4xl">
            We couldn&apos;t find that page
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-fg-muted">
            The link you followed may be broken, or the page may have been
            moved. Head back to the home page or your dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <GlowButton href="/" size="md">
              Back to home
              <ArrowRight className="h-4 w-4" />
            </GlowButton>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full glass px-5 py-2.5 text-sm text-fg-muted transition-colors hover:text-fg"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
