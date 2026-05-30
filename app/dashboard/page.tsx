import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Flame,
  Lock,
  Ruler,
  Sparkles,
} from "lucide-react";
import { auth } from "@/auth";
import { PaperSheet } from "@/components/paper-sheet";
import { FirstRunEmptyState } from "@/components/dashboard/empty-state";
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
import {
  currentMilestone,
  getStreakSummary,
  getWeeklyActivity,
} from "@/lib/streaks";
import { ExamCountdownBanner } from "@/components/dashboard/exam-countdown";
import { StreakMilestone } from "@/components/dashboard/streak-milestone";
import { WeeklyGoalCard } from "@/components/dashboard/weekly-goal";
import { cn } from "@/lib/utils";
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

  // Streak summary drives the Flame stat tile + the "Practise today" nudge.
  const streak = userId
    ? await getStreakSummary(userId)
    : {
        current: 0,
        longest: 0,
        totalDays: 0,
        practisedToday: false,
        daysSinceLast: null,
      };

  // Weekly goal (5/7) — the strongest non-streak engagement loop. Even when
  // a user misses a day they can still hit the weekly target and feel they
  // won the week.
  const weekly = userId
    ? await getWeeklyActivity(userId)
    : { days: Array(7).fill(false), done: 0, target: 5, hit: false };

  const milestone = currentMilestone(streak.current);

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
      icon: Flame,
      label: streak.current === 1 ? "Day streak" : "Day streak",
      value: String(streak.current),
      note:
        streak.current === 0
          ? "Start today to begin one"
          : streak.current >= streak.longest
            ? "Personal best — keep it going"
            : `Best: ${streak.longest} days`,
    },
    {
      icon: FileText,
      label: "Papers this month",
      value: String(paperStats?.count ?? 0),
      note: "this billing month",
    },
    {
      icon: BookOpen,
      label: "Subjects",
      value: String(subjects.length),
      note: `${subjects.filter((s) => s.hasProfile).length} ready to generate`,
    },
    {
      icon: Ruler,
      label: "Blueprints",
      value: String(STARTER_BLUEPRINTS.length),
      note: "starter formats + your own",
    },
  ];

  // Welcome copy that adapts to streak state. The goal is to feel like
  // Duolingo's homepage — instant feedback on whether you showed up today.
  const welcome =
    streak.current === 0
      ? {
          eyebrow: "Welcome to QraftPaper",
          title: "Generate your first mock paper today.",
          sub: "Add a subject, drop in your syllabus, and you'll see your first practice paper in under a minute.",
        }
      : streak.current === 1
        ? {
            eyebrow: "Day 1 on the board",
            title: "Nice — come back tomorrow to keep the streak.",
            sub: "Practising at least once a day builds the habit. Two days in a row is harder than you'd think.",
          }
        : streak.practisedToday
          ? {
              eyebrow: `${streak.current}-day streak`,
              title: "You've shown up today. Keep going.",
              sub:
                streak.current >= streak.longest
                  ? "This is your personal best — every day from here resets the bar higher."
                  : `${streak.longest - streak.current} more days to match your record of ${streak.longest}.`,
            }
          : {
              eyebrow: `${streak.current}-day streak — don't break it`,
              title: "Do anything today and the streak holds.",
              sub: "Generate a quick MCQ, take a quiz, or just regenerate one question. Any activity counts.",
            };

  return (
    <div className="mx-auto max-w-6xl">
      {/* Exam countdown lives above EVERYTHING else (even the milestone
          celebration) because day-of urgency outranks habit feedback. */}
      <ExamCountdownBanner subjects={subjects} />
      {milestone !== null && <StreakMilestone milestone={milestone} />}
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
              {streak.current > 0 && (
                <Flame className="h-3.5 w-3.5 text-gold" />
              )}
              {welcome.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gradient">
              {welcome.title}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-fg-muted">
              {welcome.sub}
            </p>
          </div>
          <GlowButton href="/dashboard/subjects/new" size="md">
            <Sparkles className="h-4 w-4" />
            New subject
          </GlowButton>
        </div>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => {
          // First tile = streak. Highlight it with a gold ring + flame tone
          // when the streak is active so the dashboard reads "I'm winning"
          // rather than "I'm reading a CRM."
          const isStreak = i === 0;
          const streakActive = isStreak && streak.current > 0;
          return (
            <Reveal key={s.label} delay={i * 0.06}>
              <GlassCard
                hover
                className={cn(
                  "h-full p-5",
                  streakActive && "ring-1 ring-gold/30",
                )}
              >
                <IconTile
                  icon={s.icon}
                  tone={streakActive ? "gold" : "neutral"}
                  size="sm"
                />
                <p
                  className={cn(
                    "mt-4 text-3xl font-semibold tracking-tight",
                    streakActive && "text-gold",
                  )}
                >
                  {s.value}
                </p>
                <p className="mt-0.5 text-[0.82rem] text-fg-muted">{s.label}</p>
                <p className="mt-2 font-mono text-[0.64rem] uppercase tracking-wider text-fg-subtle">
                  {s.note}
                </p>
              </GlassCard>
            </Reveal>
          );
        })}
      </div>

      {/* Weekly goal — shown to every authenticated user, even brand-new
          accounts (encourages day-1 practice). Hidden only when there's no
          session at all (the dashboard already redirects in that case). */}
      {userId && (
        <Reveal>
          <div className="mt-6">
            <WeeklyGoalCard weekly={weekly} />
          </div>
        </Reveal>
      )}

      {subjects.length === 0 ? (
        // Brand-new account — instead of three empty "configure your blueprint"
        // panels, show one warm onboarding card with a clear "create subject"
        // CTA and a "try the sample quiz now" escape hatch.
        <FirstRunEmptyState />
      ) : (
        <>
          <SubjectsSection subjects={subjects} />
          <GenerationPanel subjects={subjects} />
          <Reveal>
            <QuizLaunch subjects={subjects} />
          </Reveal>
        </>
      )}

      <div className="mt-10 grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        {recentPapers.length === 0 ? (
          // Only show the sample-paper teaser to users who have never generated
          // their own paper — otherwise it's just clutter telling paid customers
          // to "subscribe to unlock generation".
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
                {/* gradient fade masks the cut-off sheet. We lead with the
                    free demo quiz CTA (zero-friction, real product feel)
                    and put Subscribe second instead of jumping straight to
                    a paywall before the user has felt any value. */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-canvas via-canvas/95 to-transparent px-6 pb-6 pt-24 text-center">
                  <p className="max-w-sm text-sm text-fg-muted">
                    This is what we&apos;d generate from your syllabus. Take a
                    sample MCQ quiz to feel it for yourself — it&apos;s free
                    and uses no credits.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <GlowButton href="/dashboard/demo-quiz" size="md">
                      Try a sample quiz
                      <ArrowRight className="h-4 w-4" />
                    </GlowButton>
                    <GlowButton
                      href="/billing"
                      variant="secondary"
                      size="md"
                    >
                      Subscribe to generate
                    </GlowButton>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        ) : (
          // Show the most recent real paper instead of the sample mock.
          <Reveal>
            <GlassCard className="flex h-full flex-col p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-violet-bright" />
                  <div className="leading-tight">
                    <p className="text-sm font-medium">Latest paper</p>
                    <p className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                      {recentPapers[0].content?.subjectCode ?? "Paper"} ·{" "}
                      {recentPapers[0].content?.totalMarks ?? 0} marks
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/papers"
                  className="flex items-center gap-1 text-[0.74rem] text-violet-bright transition-colors hover:text-violet"
                >
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">
                {recentPapers[0].title}
              </h3>
              <p className="mt-1 text-[0.82rem] text-fg-muted">
                {recentPapers[0].content?.subject ?? "Generated paper"}
              </p>
              <div className="mt-auto pt-4">
                <GlowButton
                  href={`/papers/${recentPapers[0].id}`}
                  size="md"
                  className="w-full"
                >
                  Open editor
                  <ArrowRight className="h-4 w-4" />
                </GlowButton>
              </div>
            </GlassCard>
          </Reveal>
        )}

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
