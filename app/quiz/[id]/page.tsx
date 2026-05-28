import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Download, FileText, ListChecks } from "lucide-react";
import { auth } from "@/auth";
import { QuizRunner } from "@/components/quiz-runner";
import { RegenerateQuizButton } from "@/components/quiz/regenerate-quiz-button";
import { ShareQuizButton } from "@/components/quiz/share-quiz-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { MeterBar } from "@/components/ui/meter-bar";
import { isQuiz } from "@/lib/content-validation";
import { getDb } from "@/lib/db";
import { quizzes } from "@/lib/db/schema";
import { difficultyBarFill } from "@/lib/difficulty";
import { isUuid } from "@/lib/ids";
import type { Difficulty } from "@/lib/types";

export const metadata: Metadata = {
  title: "Quiz preview — QraftPaper",
};

export const runtime = "nodejs";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    notFound();
  }

  if (!isUuid(id)) {
    notFound();
  }

  const [quizRecord] = await getDb()
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, id), eq(quizzes.userId, session.user.id)))
    .limit(1);

  if (!quizRecord?.content || !isQuiz(quizRecord.content)) {
    notFound();
  }

  const quiz = quizRecord.content;
  const total = quiz.questions.length;
  const counts: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
  quiz.questions.forEach((q) => (counts[q.difficulty] += 1));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-3.5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
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
              <p className="text-sm font-medium">{quiz.title}</p>
              <p className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                {quiz.subjectCode} · AI-generated · Answer key included
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShareQuizButton quizId={quiz.id} />
            <GlowButton
              href={`/api/export/quiz/${quiz.id}/docx`}
              variant="secondary"
              size="sm"
            >
              <FileText className="h-3.5 w-3.5" />
              Export Word
            </GlowButton>
            <GlowButton
              href={`/api/export/quiz/${quiz.id}/pdf`}
              variant="secondary"
              size="sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </GlowButton>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-4 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_300px]">
        <QuizRunner quiz={quiz} />

        <div className="flex flex-col gap-3">
          <GlassCard className="p-5">
            <h4 className="text-sm font-semibold tracking-tight">Quiz summary</h4>
            <dl className="mt-4 flex flex-col gap-2.5 text-[0.82rem]">
              <div className="flex justify-between">
                <dt className="text-fg-muted">Subject</dt>
                <dd className="font-mono text-fg">{quiz.subjectCode}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-muted">Questions</dt>
                <dd className="font-mono text-fg">{total}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-muted">Duration</dt>
                <dd className="font-mono text-fg">{quiz.durationMins} min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-muted">Format</dt>
                <dd className="font-mono text-fg">MCQ</dd>
              </div>
            </dl>
          </GlassCard>

          <GlassCard className="p-5">
            <h4 className="text-sm font-semibold tracking-tight">Difficulty mix</h4>
            <div className="mt-4 flex flex-col gap-3">
              {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
                <div key={d}>
                  <div className="flex justify-between text-[0.76rem]">
                    <span className="text-fg-muted">{d}</span>
                    <span className="font-mono text-fg-subtle">{counts[d]}</span>
                  </div>
                  <MeterBar
                    pct={total ? (counts[d] / total) * 100 : 0}
                    fill={difficultyBarFill[d]}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="flex items-center gap-2.5">
              <IconTile icon={ListChecks} size="sm" />
              <p className="text-sm font-medium">From your material</p>
            </div>
            <p className="mt-2 text-[0.8rem] leading-relaxed text-fg-muted">
              Every question is generated from the uploaded syllabus and
              previous year papers, then mapped to a unit and difficulty.
            </p>
          </GlassCard>

          <RegenerateQuizButton
            subjectId={quizRecord.subjectId}
            questionCount={total}
            durationMins={quiz.durationMins}
          />
        </div>
      </main>
    </div>
  );
}
