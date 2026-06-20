import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

import { Logo } from "@/components/logo";
import { GlowButton } from "@/components/ui/glow-button";
import { DemoQuizClient } from "./demo-client";

export const metadata: Metadata = {
  title: "Sample MCQ quiz — QraftPaper",
  description:
    "Pick your level and subject, then try a real QraftPaper-generated MCQ quiz with timer + scoring. No signup required.",
  alternates: { canonical: "/demo/quiz" },
};

export const runtime = "nodejs";

/**
 * Public "try before signup" demo. Previously a single fixed Data Structures
 * quiz; now the visitor first picks their level (school / college) and subject
 * via DemoQuizClient, which then runs a matching sample quiz. Everything is
 * static and client-side — no DB row, no AI cost, no signup.
 */
export default function DemoQuizPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Logo />
          <GlowButton href="/dashboard/subjects/new" size="sm">
            <Sparkles className="h-3.5 w-3.5" />
            Build your own
          </GlowButton>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <DemoQuizClient />
      </main>
    </div>
  );
}
