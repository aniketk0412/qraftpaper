import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { QuizRunner } from "@/components/quiz-runner";
import { GlowButton } from "@/components/ui/glow-button";
import { exampleQuiz } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: "Sample quiz — QraftPaper",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";

/**
 * A free, fully-interactive demo quiz for signed-in users who haven't paid
 * yet. The empty-state dashboard links here so a new user can experience
 * what QraftPaper actually produces before being asked for $7. Reuses the
 * same QuizRunner the real flow uses — same timer, same grading UX —
 * pointed at the static `exampleQuiz` from demo-data so it costs us $0 to
 * render.
 */
export default async function DemoQuizPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full glass text-fg-muted transition-colors hover:text-fg"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="h-8 w-px bg-line" />
            <div className="leading-tight">
              <p className="text-sm font-medium">Sample MCQ quiz</p>
              <p className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                {exampleQuiz.subjectCode} · {exampleQuiz.questions.length}{" "}
                questions · this is what we&apos;d generate from your syllabus
              </p>
            </div>
          </div>
          <GlowButton href="/billing" size="sm">
            <Sparkles className="h-3.5 w-3.5" />
            Subscribe to generate your own
          </GlowButton>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <QuizRunner
          quiz={exampleQuiz}
          backHref="/dashboard"
          backLabel="Back to dashboard"
        />
      </main>
    </div>
  );
}
