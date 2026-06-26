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
import { examplePaperForLevel } from "@/lib/demo-data";
import type { QuestionPaper } from "@/lib/types";
import { getDb } from "@/lib/db";
import { papers, quizAttempts, quizzes, usage, users } from "@/lib/db/schema";
import { computeReadiness } from "@/lib/exam-readiness";
import { computeAchievements } from "@/lib/achievements";
import { AchievementsShelf } from "@/components/dashboard/achievements-shelf";
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
    quizAggRow,
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
          .select({
            plan: users.plan,
            educationLevel: users.educationLevel,
          })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
          .then((rows) => rows[0] ?? { plan: "unpaid", educationLevel: null }),
        // Degrade to 0 rather than taking down the whole dashboard if this
        // fails. The drill queue is an auxiliary metric — on a preview deploy
        // (which skips migrations) the question_reviews table may not exist
        // yet, and a transient DB hiccup shouldn't 500 the landing surface.
        getDueReviewCount(userId).catch(() => 0),
        // All-time quiz effort for the achievements shelf — questions answered
        // and best score. One parallel aggregate; degrades to zeros on failure.
        getDb()
          .select({
            answered: sql<number>`coalesce(sum(${quizAttempts.total}), 0)::int`,
            best: sql<number>`coalesce(max(case when ${quizAttempts.total} > 0 then round(${quizAttempts.score}::numeric / ${quizAttempts.total} * 100) else 0 end), 0)::int`,
          })
          .from(quizAttempts)
          .where(eq(quizAttempts.takerUserId, userId))
          .then((rows) => rows[0] ?? { answered: 0, best: 0 })
          .catch(() => ({ answered: 0, best: 0 })),
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
        { plan: "unpaid", educationLevel: null },
        0,
        { answered: 0, best: 0 },
      ];

  const paperStats = paperStatsRow;
  // Monthly generation budget for the GenerationPanel + QuizLaunch hint,
  // pulled from the single-source-of-truth PLANS table. 0 = unpaid.
  const generationsUsed = usageRow.generations;
  const generationsCap =
    PLANS[(profileRow.plan ?? "unpaid") as PlanId]?.generationsPerMonth ?? 0;

  // The sample paper shown to users without their own papers, matched to the
  // account's education level (school students see a school paper, not the
  // B.Tech DSA one).
  const samplePaper: QuestionPaper = examplePaperForLevel(
    profileRow.educationLevel,
  );

  const milestone = currentMilestone(streak.current);

  // Achievement badges — derived from data already loaded (subjects + streak)
  // plus the all-time quiz aggregate. Pure; no extra query beyond the one above.
  const achievements = computeAchievements({
    totalPapers: subjects.reduce((n, s) => n + s.papers, 0),
    totalQuizzes: subjects.reduce((n, s) => n + s.quizzesTaken, 0),
    totalQuestionsAnswered: quizAggRow.answered,
    bestQuizPct: quizAggRow.answered > 0 ? quizAggRow.best : null,
    longestStreak: streak.longest,
    subjectsWithProfile: subjects.filter((s) => s.hasProfile).length,
    subjectsExamReady: subjects.filter(
      (s) =>
        computeReadiness({
          hasProfile: s.hasProfile,
          masteryPct: s.masteryPct,
          quizzesTaken: s.quizzesTaken,
          papersGenerated: s.papers,
        }).band === "ready",
    ).length,
  });

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

  // Welcome copy adapts to recent activity without making the dashboard feel
  // like a toy habit app.
  const welcome =
    streak.current === 0
      ? {
          eyebrow: "Welcome to QraftPaper",
          title: "Build your first exam-ready paper workspace.",
          sub: "Add a subject, attach the syllabus and PYQs, then generate papers and quizzes from the same structured profile.",
        }
      : streak.current === 1
        ? {
            eyebrow: "First workspace activity logged",
            title: "Your exam workflow is starting to take shape.",
            sub: "Generate another paper or quiz to keep the subject profile active and useful.",
          }
        : streak.practisedToday
          ? {
              eyebrow: `${streak.current}-day streak`,
              title: "Today's exam-prep activity is logged.",
              sub:
                streak.current >= streak.longest
                  ? "This is your strongest activity run so far."
                  : `${streak.longest - streak.current} more days to match your record of ${streak.longest}.`,
            }
          : {
              eyebrow: `${streak.current}-day activity streak`,
              title: "Run one useful action to keep the workspace current.",
              sub: "Generate a paper, start a quiz, or revise one subject profile. Any meaningful activity counts.",
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
        <div className="relative overflow-hidden border border-line bg-canvas">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--bg-grid-fine) 1px, transparent 1px)," +
                "linear-gradient(to bottom, var(--bg-grid-fine) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage:
                "linear-gradient(135deg, #000 0%, transparent 78%)",
              WebkitMaskImage:
                "linear-gradient(135deg, #000 0%, transparent 78%)",
            }}
          />
          <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
            <div>
              <p className="flex items-center gap-2.5 font-mono text-[0.66rem] uppercase tracking-[0.22em] text-fg-subtle">
                <span className="h-px w-6 bg-accent" />
                {streak.current > 0 && <Flame className="h-3.5 w-3.5 text-gold" />}
                {welcome.eyebrow}
              </p>
              <h1 className="mt-3 max-w-2xl text-[1.9rem] font-semibold leading-[1.08] tracking-tight sm:text-4xl">
                {welcome.title}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">
                {welcome.sub}
              </p>
            </div>
            <GlowButton href="/dashboard/subjects/new" size="md">
              <Sparkles className="h-4 w-4" />
              New subject
            </GlowButton>
          </div>
        </div>
      </Reveal>

      {/* Metrics as a continuous draftsman titleblock: flat cells divided by
          shared hairline rules, each a zero-padded mono numeral over a
          tracking-widest field label. The numeral inks red on a live streak,
          indigo on a non-empty review queue — the only colour the strip ever
          carries. */}
      <Reveal className="mt-6">
        <div className="plate-grid grid grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => {
            const lit = s.highlight;
            const numTone =
              lit === "gold"
                ? "text-gold"
                : lit === "violet"
                  ? "text-violet-bright"
                  : "text-fg";
            const value = String(Number(s.value) || 0).padStart(2, "0");
            const content = (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-fg-subtle">
                    {String(i + 1).padStart(2, "0")} / 04
                  </span>
                  {s.href ? (
                    <ArrowRight className="h-3.5 w-3.5 text-fg-subtle transition-transform duration-150 group-hover:translate-x-0.5" />
                  ) : (
                    <s.icon
                      className={cn(
                        "h-3.5 w-3.5",
                        lit ? numTone : "text-fg-subtle",
                      )}
                    />
                  )}
                </div>
                <p
                  className={cn(
                    "mt-7 font-mono text-[2.7rem] font-semibold leading-none tabular-nums",
                    numTone,
                  )}
                >
                  {value}
                </p>
                <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-fg-muted">
                  {s.label}
                </p>
                <p className="mt-1 text-[0.72rem] leading-snug text-fg-subtle">
                  {s.note}
                </p>
              </>
            );
            const cell =
              "group flex h-full flex-col p-5 transition-colors duration-150 hover:bg-card-hi";
            return s.href ? (
              <Link
                key={s.label}
                href={s.href}
                className={cn(
                  cell,
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
                )}
              >
                {content}
              </Link>
            ) : (
              <div key={s.label} className={cell}>
                {content}
              </div>
            );
          })}
        </div>
      </Reveal>

      {subjects.length === 0 ? (
        // Brand-new account — one warm onboarding card (clear "create subject"
        // CTA + a "try the sample quiz" escape hatch), then the sample paper so
        // a not-yet-paying visitor can see and feel the output before deciding.
        <>
          <FirstRunEmptyState />
          <div className="mt-6">
            <SamplePaperTeaser paper={samplePaper} />
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
                  mis-anchor inside a transformed (animating) ancestor.
                  id="generate" is the deep-link target for the sidebar's
                  "Generate" CTA; scroll-mt clears the sticky topbar. */}
              <div id="generate" className="scroll-mt-24">
                <GenerationPanel
                  subjects={subjects}
                  generationsUsed={generationsUsed}
                  generationsCap={generationsCap}
                />
              </div>
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
              <Reveal delay={0.04}>
                <AchievementsShelf achievements={achievements} />
              </Reveal>
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
              <SamplePaperTeaser paper={samplePaper} />
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
function SamplePaperTeaser({ paper }: { paper: QuestionPaper }) {
  return (
    <Reveal>
      <div className="overflow-hidden rounded-2xl glass-strong">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-violet-bright" />
            <div className="leading-tight">
              <p className="text-sm font-medium">Sample generated paper</p>
              <p className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                {paper.subjectCode} · {paper.totalMarks} marks
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-[2px] border border-gold/30 bg-gold/10 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-wider text-gold">
            <Lock className="h-3 w-3" />
            Sample
          </span>
        </div>

        <div className="relative">
          <div className="max-h-[26rem] overflow-hidden">
            <PaperSheet paper={paper} />
          </div>
          {/* gradient fade masks the cut-off sheet. We lead with the free demo
              quiz CTA (zero-friction, real product feel) and put Subscribe
              second instead of jumping straight to a paywall before the user
              has felt any value. */}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 bg-gradient-to-t from-canvas via-canvas/95 to-transparent px-6 pb-6 pt-24 text-center">
            <p className="max-w-sm text-sm text-fg-muted">
              This is the structure QraftPaper can produce from your syllabus.
              Open the sample quiz to review the learner-side flow before
              generating from your own material.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <GlowButton href="/dashboard/demo-quiz" size="md">
                Open sample quiz
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
