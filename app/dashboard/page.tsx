import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  FileText,
  Lock,
  Ruler,
  Sparkles,
} from "lucide-react";
import { auth } from "@/auth";
import { PaperSheet } from "@/components/paper-sheet";
import { GenerationPanel } from "@/components/dashboard/generation-panel";
import { QuizLaunch } from "@/components/dashboard/quiz-launch";
import { SubjectsSection } from "@/components/dashboard/subjects-section";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { Reveal } from "@/components/ui/reveal";
import { examplePaper } from "@/lib/demo-data";
import { getDb } from "@/lib/db";
import { papers, quizzes } from "@/lib/db/schema";
import { listUserSubjects } from "@/lib/subjects";
import { STARTER_BLUEPRINTS } from "@/lib/blueprints";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const subjects = userId ? await listUserSubjects(userId) : [];
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [paperStats] = userId
    ? await getDb()
        .select({
          count: sql<number>`count(${papers.id})::int`,
        })
        .from(papers)
        .where(and(eq(papers.userId, userId), gte(papers.createdAt, monthStart)))
    : [{ count: 0 }];
  const recentPapers = userId
    ? await getDb()
        .select({
          id: papers.id,
          title: papers.title,
          createdAt: papers.createdAt,
          content: papers.content,
        })
        .from(papers)
        .where(eq(papers.userId, userId))
        .orderBy(desc(papers.createdAt))
        .limit(4)
    : [];

  const recentQuizzes = userId
    ? await getDb()
        .select({
          id: quizzes.id,
          title: quizzes.title,
          createdAt: quizzes.createdAt,
        })
        .from(quizzes)
        .where(eq(quizzes.userId, userId))
        .orderBy(desc(quizzes.createdAt))
        .limit(4)
    : [];

  const activity = [
    ...recentPapers.map((paper) => ({
      id: paper.id,
      title: paper.title,
      href: `/papers/${paper.id}`,
      time: formatRelativeDate(paper.createdAt),
      meta: `${paper.content?.totalMarks ?? 0} marks`,
    })),
    ...recentQuizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      href: `/quiz/${quiz.id}`,
      time: formatRelativeDate(quiz.createdAt),
      meta: "MCQ quiz",
    })),
  ].slice(0, 4);

  const stats = [
    {
      icon: BookOpen,
      label: "Active subjects",
      value: String(subjects.length),
      note: "owned by your account",
    },
    {
      icon: FileText,
      label: "Papers generated",
      value: String(paperStats?.count ?? 0),
      note: "this month",
    },
    {
      icon: Clock,
      label: "Profiles ready",
      value: String(subjects.filter((subject) => subject.hasProfile).length),
      note: "ready for generation",
    },
    {
      icon: Ruler,
      label: "Blueprints",
      value: String(STARTER_BLUEPRINTS.length),
      note: "starter formats + your own",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
              Workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gradient">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-fg-muted">
              {"Here's what's moving in your examination workspace today."}
            </p>
          </div>
          <GlowButton href="/dashboard/subjects/new" size="md">
            <Sparkles className="h-4 w-4" />
            New subject
          </GlowButton>
        </div>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06}>
            <GlassCard hover className="h-full p-5">
              <IconTile icon={s.icon} tone="neutral" size="sm" />
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {s.value}
              </p>
              <p className="mt-0.5 text-[0.82rem] text-fg-muted">{s.label}</p>
              <p className="mt-2 font-mono text-[0.64rem] uppercase tracking-wider text-fg-subtle">
                {s.note}
              </p>
            </GlassCard>
          </Reveal>
        ))}
      </div>

      <SubjectsSection subjects={subjects} />

      <GenerationPanel subjects={subjects} />

      <Reveal>
        <QuizLaunch subjects={subjects} />
      </Reveal>

      <div className="mt-10 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Reveal>
          <div className="overflow-hidden rounded-2xl glass-strong">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-violet-bright" />
                <div className="leading-tight">
                  <p className="text-sm font-medium">Sample generated paper</p>
                  <p className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                    {examplePaper.subjectCode} · {examplePaper.totalMarks} marks
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-wider text-gold">
                <Lock className="h-3 w-3" />
                Sample
              </span>
            </div>

            <div className="relative">
              <div className="max-h-[26rem] overflow-hidden">
                <PaperSheet paper={examplePaper} />
              </div>
              {/* gradient fade masks the cut-off sheet and houses the upgrade CTA */}
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-canvas via-canvas/95 to-transparent px-6 pb-6 pt-24 text-center">
                <p className="max-w-sm text-sm text-fg-muted">
                  This is an example paper. Subscribe to generate papers from
                  your own syllabus, PYQs and weightages.
                </p>
                <GlowButton href="/billing" size="md">
                  Subscribe to unlock generation
                  <ArrowRight className="h-4 w-4" />
                </GlowButton>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <GlassCard className="h-full p-5">
            <h2 className="text-sm font-semibold tracking-tight">
              Recent activity
            </h2>
            <div className="mt-4 flex flex-col gap-1">
              {activity.map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-tint/[0.03]"
                >
                  <IconTile icon={FileText} tone="neutral" size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.84rem] font-medium">
                      {a.title}
                    </p>
                    <p className="font-mono text-[0.64rem] uppercase tracking-wider text-fg-subtle">
                      {a.time} · {a.meta}
                    </p>
                  </div>
                </Link>
              ))}
              {activity.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-fg-subtle">
                  Generated papers and quizzes will appear here.
                </p>
              )}
            </div>
            <Link
              href="/dashboard/subjects/new"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-line py-2.5 text-[0.8rem] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              Create a subject <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </GlassCard>
        </Reveal>
      </div>
    </div>
  );
}

function formatRelativeDate(date: Date | null) {
  if (!date) return "Just now";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}
