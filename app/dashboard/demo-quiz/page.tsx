import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { auth } from "@/auth";
import { GlowButton } from "@/components/ui/glow-button";
import { DemoQuizClient } from "@/app/demo/quiz/demo-client";

export const metadata: Metadata = {
  title: "Sample quiz — QraftPaper",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";

/**
 * A free, fully-interactive demo quiz for signed-in users who haven't paid
 * yet. The empty-state dashboard links here so a new user can experience what
 * QraftPaper produces before being asked to subscribe. Reuses the same
 * level/subject picker as the public demo (DemoQuizClient) — pointed at static
 * sample quizzes so it costs $0 — with the CTAs swapped to the in-app upsell.
 */
export default async function DemoQuizPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full glass text-fg-muted transition-colors hover:text-fg"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="h-8 w-px bg-line" />
            <p className="text-sm font-medium">Sample MCQ quiz</p>
          </div>
          <GlowButton href="/billing" size="sm">
            <Sparkles className="h-3.5 w-3.5" />
            Subscribe to generate your own
          </GlowButton>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <DemoQuizClient signedIn />
      </main>
    </div>
  );
}
