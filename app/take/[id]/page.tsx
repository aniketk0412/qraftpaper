import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight, ListChecks, Sparkles } from "lucide-react";

import { Logo } from "@/components/logo";
import { QuizRunner } from "@/components/quiz-runner";
import { GridBackdrop } from "@/components/landing/grid-backdrop";
import { GlowButton } from "@/components/ui/glow-button";
import { isQuiz } from "@/lib/content-validation";
import { getDb } from "@/lib/db";
import { quizzes } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";

export const runtime = "nodejs";

async function loadQuiz(id: string) {
  if (!isUuid(id)) {
    return null;
  }

  const [record] = await getDb()
    .select({ title: quizzes.title, content: quizzes.content })
    .from(quizzes)
    .where(eq(quizzes.id, id))
    .limit(1);
  return record?.content && isQuiz(record.content) ? record.content : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const quiz = await loadQuiz(id);

  if (!quiz) {
    return { title: "Quiz not found — QraftPaper", robots: { index: false } };
  }

  return {
    title: `${quiz.title} — Practice quiz`,
    description: `Take this ${quiz.subjectCode} practice quiz on QraftPaper — ${quiz.questions.length} multiple-choice questions with instant scoring.`,
    // User-generated quizzes shouldn't be indexed, but should preview nicely when shared.
    robots: { index: false, follow: true },
    openGraph: {
      title: `${quiz.title} — Practice quiz`,
      description: `${quiz.subjectCode} · ${quiz.questions.length} questions · instant scoring`,
      type: "website",
    },
  };
}

export default async function TakeQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await loadQuiz(id);

  if (!quiz) {
    notFound();
  }

  // Strip the answer key from the payload sent to the browser — takers learn
  // correctness only by submitting an answer to the grading API.
  const safeQuiz = {
    ...quiz,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      unit: q.unit,
      difficulty: q.difficulty,
    })),
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <GridBackdrop />
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8">
          <Logo />
          <GlowButton href="/signup" size="sm">
            <Sparkles className="h-3.5 w-3.5" />
            Build your own
          </GlowButton>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <div className="mb-6">
          <p className="flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.2em] text-violet-bright">
            <ListChecks className="h-3.5 w-3.5" />
            Shared practice quiz
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gradient sm:text-3xl">
            {quiz.title}
          </h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            {quiz.subjectCode} · {quiz.questions.length} questions ·{" "}
            {quiz.durationMins} min · instant scoring
          </p>
        </div>

        <QuizRunner
          quiz={safeQuiz}
          gradeUrl={`/api/quiz/${id}/grade`}
          backHref="/signup"
          backLabel="Create your own quiz"
        />

        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl glass p-6 text-center">
          <p className="text-sm text-fg-muted">
            This quiz was generated with QraftPaper from a real syllabus and
            past papers.
          </p>
          <GlowButton href="/signup" size="md">
            Generate your own papers & quizzes
            <ArrowRight className="h-4 w-4" />
          </GlowButton>
        </div>
      </main>
    </div>
  );
}
