import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  FileText,
  Flame,
  Lock,
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
import { papers, quizzes, usage, users } from "@/lib/db/schema";
import { PLANS, type PlanId } from "@/lib/plans";
import { currentUsageMonth } from "@/lib/usage";
import { getDueReviewCount } from "@/lib/reviews";
import { listUserSubjects } from "@/lib/subjects";
import {
  currentMilestone,
  getStreakSummary,
  getWeeklyActivity,
} from "@/lib/streaks";
import { DrillMistakesCard } from "@/components/dashboard/drill-mistakes-card";
import {
  ExamCountdownBanner,
  hasUrgentExam,
} from "@/components/dashboard/exam-countdown";
import { NextUpCard } from "@/components/dashboard/next-up";
import { StreakMilestone } from "@/components/dashboard/streak-milestone";
import { WeeklyGoalCard } from "@/components/dashboard/weekly-goal";
import { cn } from "@/lib/utils";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // Eight independent reads — none depend on the result of any other. Run
  // them in parallel so dashboard latency is bounded by the slowest one
  // (the streak summary, which scans a year of study_activity), not the
  // sum. Previously each `await` ran sequentially: 8× DB round-trip
  // latency.
  const monthKey = currentUsageMonth();
  const [
    subjects,
    paperStatsRow,
    recentPapers,
    recentQuizzes,
    streak,
    weekly,
    usageRow,
    profileRow,
    dueReviewCount,
  ] = userId
    ? await Promise.all([
        listUserSubjects(userId),
        getDb()
          .select({ count: sql<number>`count(${papers.id})::int` })
          .from(papers)
          .where(
            and(eq(papers.userId, userId), gte(papers.createdAt, monthStart)),
          )
          .then((rows) => rows[0] ?? { count: 0 }),
        getDb()
          .select({
            id: papers.id,
            title: papers.title,
            createdAt: papers.createdAt,
            content: papers.content,
          })
          .from(papers)
          .where(eq(papers.userId, userId))
          .orderBy(desc(papers.createdAt))
          .limit(4),
        getDb()
          .select({
            id: quizzes.id,
            title: quizzes.title,
            createdAt: quizzes.createdAt,
          })
          .from(quizzes)
          .where(eq(quizzes.userId, userId))
          .orderBy(desc(quizzes.createdAt))
          .limit(4),
        getStreakSummary(userId),
        getWeeklyActivity(userId),
        getDb()
          .select({ generations: usage.generations })
          .from(usage)
          .where(and(eq(usage.userId, userId), eq(usage.month, monthKey)))
          .limit(1)
          .then((rows) => rows[0] ?? { generations: 0 }),
        getDb()
          .select({ plan: users.plan })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
          .then((rows) => rows[0] ?? { plan: "unpaid" }),
        getDueReviewCount(userId),
      ])
    : [
        [],
        { count: 0 },
        [],
        [],
        {
          current: 0,
          longest: 0,
          totalDays: 0,
          practisedToday: false,
          daysSinceLast: null,
        },
        { days: Array(7).fill(false), done: 0, target: 5, hit: false },
        { generations: 0 },
        { plan: "unpaid" },
        0,
      ];

  const paperStats = paperStatsRow;
  // Monthly generation budget for the GenerationPanel + QuizLaunch hint —
  // pulled from the single-source-of-truth PLANS table. null = unlimited
  // (institution). 0 = unpaid (which the panel renders as a subscribe nudge).
  const generationsUsed = usageRow.generations;
  const generationsCap =
    PLANS[(profileRow.plan ?? "unpaid") as PlanId]?.generationsPerMonth ?? 0;

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

  const stats: {
    icon: typeof Flame;
    label: string;
    value: string;
    note: string;
    href?: string;
    /** When set, the tile lights up in that tone — used to make the strip
     *  react to live state (an active streak, a non-empty review queue)
     *  rather than sitting there as four identical readouts. */
    highlight?: "gold" | "violet";
  }[] = [
    {
      icon: Flame,
      label: "Day streak",
      value: String(streak.current),
      note:
        streak.current === 0
          ? "Start today to begin one"
          : streak.current >= streak.longest
            ? "Personal best — keep it going"
            : `Best: ${streak.longest} days`,
      highlight: streak.current > 0 ? "gold" : undefined,
    },
    {
      icon: FileText,
      label: "Papers this month",
      value: String(paperStats?.count ?? 0),
      note: "this billing month",
      href: "/dashboard/papers",
    },
    {
      icon: BookOpen,
      label: "Subjects",
      value: String(subjects.length),
      note: `${subjects.filter((s) => s.hasProfile).length} ready to generate`,
      href: "/dashboard/subjects",
    },
    {
      // Replaces the old static "Blueprints: 3" tile (which was navigation
      // dressed as a metric) with a live, actionable number: how many
      // spaced-repetition cards are due right now. Links straight into the
      // drill so the most useful next action is one tap from the strip.
      icon: Brain,
      label: "Due for review",
      value: String(dueReviewCount),
      note: dueReviewCount > 0 ? "in your drill queue" : "all caught up",
      href: "/dashboard/drill",
      highlight: dueReviewCount > 0 ? "violet" : undefined,
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
      {/* Pre-welcome banner priority — at most two strips, never three.
          The rule that keeps this from becoming notification fatigue:
            1. Exam countdown (rare, time-critical) always shows.
            2. Streak milestone (rare, dismissable celebration) coexists —
               it's emotionally distinct from a task nudge.
            3. Drill card (common, evergreen) YIELDS to an urgent exam: a
               student cramming for a paper in 3 days should be in that
               subject, not pulled toward old mistakes from other ones.
          Worst case is therefore {exam + milestone} — one task, one
          reward — not a wall of three competing call-to-actions. */}
      <ExamCountdownBanner subjects={subjects} />
      {milestone !== null && <StreakMilestone milestone={milestone} />}
      {!hasUrgentExam(subjects) && (
        <DrillMistakesCard serverCount={dueReviewCount} />
      )}
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
          // Tiles light up in their tone when the underlying state is "live":
          // an active streak (gold) or a non-empty review queue (violet). This
          // is what stops the strip from reading like a static CRM readout —
          // the dashboard visibly reacts to whether you're winning and whether
          // there's something to do right now.
          const lit = s.highlight;
          const card = (
            <GlassCard
              hover
              className={cn(
                "h-full p-5 transition-shadow",
                lit === "gold" && "ring-1 ring-gold/30",
                lit === "violet" && "ring-1 ring-violet/35",
              )}
            >
              {/* KPI layout: icon anchors the top-left, the value is the hero
                  pinned top-right. The two balance across the card's full
                  width so a wide tile reads as a deliberate metric, not a
                  sparse box with text hugging one corner. */}
              <div className="flex items-start justify-between gap-3">
                <IconTile icon={s.icon} tone={lit ?? "neutral"} size="sm" />
                <p
                  className={cn(
                    // tabular-nums keeps the value's width identical as it
                    // rolls 9 → 10 → 100, so the four-up row never reflows.
                    "text-[2.4rem] font-semibold leading-none tracking-[-0.035em] tabular-nums",
                    lit === "gold" && "text-gold",
                    lit === "violet" && "text-violet-bright",
                  )}
                >
                  {s.value}
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between gap-2">
                <p className="text-[0.84rem] font-medium text-fg-muted">
                  {s.label}
                </p>
                {/* Navigable tiles get an arrow that nudges right on hover, so
                    the strip reads as a set of shortcuts. */}
                {s.href && (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-fg-subtle transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-fg-muted" />
                )}
              </div>
              <p className="mt-1.5 font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                {s.note}
              </p>
            </GlassCard>
          );
          return (
            <Reveal key={s.label} delay={i * 0.06}>
              {s.href ? (
                <Link
                  href={s.href}
                  className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/40"
                >
                  {card}
                </Link>
              ) : (
                card
              )}
            </Reveal>
          );
        })}
      </div>

      {subjects.length === 0 ? (
        // Brand-new account — one warm onboarding card (clear "create subject"
        // CTA + a "try the sample quiz" escape hatch), then the sample paper so
        // a not-yet-paying visitor can see and feel the output before deciding.
        <>
          <FirstRunEmptyState />
          <div className="mt-6">
            <SamplePaperTeaser />
          </div>
        </>
      ) : (
        <>
          {/* Two-zone cockpit. LEFT = "do it now" (generate + practice),
              promoted up so the core job isn't three scrolls down. RIGHT =
              the context rail (habit + glance): weekly goal, the one
              prescriptive next step, your latest paper, recent activity. On
              mobile the rail stacks under the actions, so the action is still
              what you see first. */}
          <div className="mt-8 grid items-start gap-3 lg:grid-cols-[1.5fr_1fr]">
            <div className="flex flex-col gap-3">
              {/* GenerationPanel is deliberately NOT wrapped in Reveal: it
                  renders a fixed-position progress overlay, which would
                  mis-anchor inside a transformed (animating) ancestor. */}
              <GenerationPanel
                subjects={subjects}
                generationsUsed={generationsUsed}
                generationsCap={generationsCap}
              />
              <Reveal delay={0.05}>
                <QuizLaunch subjects={subjects} />
              </Reveal>
            </div>

            <div className="flex flex-col gap-3">
              {userId && (
                <Reveal>
                  <WeeklyGoalCard weekly={weekly} />
                </Reveal>
              )}
              {/* NextUpCard self-hides (returns null) when there's nothing
                  prescriptive — left unwrapped so it leaves no empty gap. */}
              <NextUpCard subjects={subjects} />
              {recentPapers.length > 0 && (
                <Reveal delay={0.05}>
                  <GlassCard className="flex flex-col p-5">
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
                    <div className="mt-4">
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
                <GlassCard className="p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold tracking-tight">
                      Recent activity
                    </h2>
                    {recentPapers.length > 0 && (
                      <Link
                        href="/dashboard/papers"
                        className="flex items-center gap-1 text-[0.74rem] text-violet-bright transition-colors hover:text-violet"
                      >
                        View all
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
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
                </GlassCard>
              </Reveal>
            </div>
          </div>

          {/* Subjects span the full width below the cockpit — they're a grid
              that wants the room, not a rail item. */}
          <SubjectsSection subjects={subjects} />

          {/* Conversion: only users who've never generated a paper see the
              sample. Paid users with papers don't need to be sold the output
              they already produce. */}
          {recentPapers.length === 0 && (
            <div className="mt-6">
              <SamplePaperTeaser />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * The locked sample paper + zero-friction CTAs. Shown to users who haven't
 * generated their own paper yet (new accounts and not-yet-subscribed users)
 * so they can see the real output and feel the product via the free demo quiz
 * before hitting any paywall. Extracted because it appears in two branches of
 * the dashboard (no-subjects onboarding and subjects-but-no-papers).
 */
function SamplePaperTeaser() {
  return (
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
          {/* gradient fade masks the cut-off sheet. We lead with the free demo
              quiz CTA (zero-friction, real product feel) and put Subscribe
              second instead of jumping straight to a paywall before the user
              has felt any value. */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-canvas via-canvas/95 to-transparent px-6 pb-6 pt-24 text-center">
            <p className="max-w-sm text-sm text-fg-muted">
              This is what we&apos;d generate from your syllabus. Take a sample
              MCQ quiz to feel it for yourself — it&apos;s free and uses no
              credits.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <GlowButton href="/dashboard/demo-quiz" size="md">
                Try a sample quiz
                <ArrowRight className="h-4 w-4" />
              </GlowButton>
              <GlowButton href="/billing" variant="secondary" size="md">
                Subscribe to generate
              </GlowButton>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
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
