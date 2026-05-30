import {
  Banknote,
  BookOpen,
  CheckCircle2,
  Clock,
  Coins,
  Flame,
  GraduationCap,
  Infinity as InfinityIcon,
  Layers,
  Lock,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { and, desc, eq, sql } from "drizzle-orm";

import { auth } from "@/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { GlassCard } from "@/components/ui/glass-card";
import { billingTiers } from "@/lib/billing/lemonsqueezy";
import { PLANS, type PlanId } from "@/lib/plans";
import { getDb } from "@/lib/db";
import { subscriptions, usage, users } from "@/lib/db/schema";
import { listUserSubjects } from "@/lib/subjects";
import { getStreakSummary } from "@/lib/streaks";
import { currentUsageMonth } from "@/lib/usage";
import { cn } from "@/lib/utils";
import { CheckoutButton } from "./checkout-button";

export const runtime = "nodejs";

function deriveInitials(name?: string | null, email?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email ?? "U").slice(0, 2).toUpperCase();
}

/* ------------------------------------------------------------------ *
 *  Marketing content blocks
 *
 *  Every block is data-driven so copy and ordering can change without
 *  touching layout. If you tune pricing, edit lib/plans.ts — these
 *  comparison numbers below are intentionally generic (no false claims)
 *  and reference categories of cost, not specific competitors.
 * ------------------------------------------------------------------ */

const BENEFITS = [
  {
    icon: Sparkles,
    title: "20 papers + quizzes a month",
    body: "Most students burn through 8–12 in the week before a paper. 20 leaves room to also drill weak units.",
  },
  {
    icon: Layers,
    title: "Up to 5 subjects",
    body: "One slot per paper this semester — each keeps its own syllabus, blueprint and PYQ pattern.",
  },
  {
    icon: Flame,
    title: "Daily streak + topic mastery",
    body: "See exactly which units you're solid on. Streaks make showing up the default, not the exception.",
  },
  {
    icon: Send,
    title: "Shareable quiz links",
    body: "Send the same MCQ test to your study group with one link. Settle the leaderboard in the group chat.",
  },
  {
    icon: RotateCcw,
    title: "Cancel anytime",
    body: "One click from this page. Keep every paper you generated — they're yours forever.",
  },
  {
    icon: ShieldCheck,
    title: "Lemon Squeezy checkout",
    body: "Merchant of record handles VAT/GST, international cards and local currency. Your card never touches us.",
  },
];

/**
 * "What you'd otherwise spend." Honest, recognisable categories — no
 * competitor names, no fake reviews. The price comparison is what makes
 * $7/mo register as obviously cheap.
 */
const VALUE_STACK = [
  {
    icon: GraduationCap,
    label: "One private tutoring class",
    cost: "$20–40",
    note: "Per session. Usually 60 minutes.",
  },
  {
    icon: BookOpen,
    label: "A printed PYQ booklet",
    cost: "$8–15",
    note: "Static, gets outdated, no answers.",
  },
  {
    icon: Coins,
    label: "Generic AI subscription",
    cost: "$20/mo",
    note: "No syllabus, no paper pattern, no streak.",
  },
];

const COMPARE_ROWS: Array<{
  label: string;
  qraftpaper: string | boolean;
  generic: string | boolean;
  textbook: string | boolean;
}> = [
  {
    label: "Mirrors YOUR paper pattern",
    qraftpaper: true,
    generic: false,
    textbook: true,
  },
  {
    label: "Refreshes every month",
    qraftpaper: true,
    generic: true,
    textbook: false,
  },
  { label: "Timed MCQ quizzes", qraftpaper: true, generic: false, textbook: false },
  {
    label: "Streak + mastery tracking",
    qraftpaper: true,
    generic: false,
    textbook: false,
  },
  {
    label: "Shareable with friends",
    qraftpaper: true,
    generic: false,
    textbook: false,
  },
  {
    label: "PDF & Word export",
    qraftpaper: true,
    generic: "Partial",
    textbook: false,
  },
  { label: "Monthly cost", qraftpaper: "$7", generic: "$20", textbook: "$10+" },
];

const TRUST_BADGES = [
  { icon: ShieldCheck, label: "Lemon Squeezy MoR" },
  { icon: Lock, label: "Card never touches QraftPaper" },
  { icon: RotateCcw, label: "Cancel in one click" },
  { icon: Banknote, label: "USD billed, INR displayed" },
];

const FAQ_ITEMS = [
  {
    q: "What happens to my papers if I cancel?",
    a: "They stay. You can still download as PDF or Word — you just can't generate new ones until you resubscribe. We never delete your generations.",
  },
  {
    q: "Are the questions guaranteed correct?",
    a: "No. Output is AI-generated and meant for practice. Always cross-check against your textbook before treating it as gospel — but that's the point of practice anyway.",
  },
  {
    q: "How is billing handled?",
    a: "Lemon Squeezy is the merchant of record. They handle international cards, VAT/GST and local currency display. Your card details never touch QraftPaper.",
  },
  {
    q: "Can I switch payment methods later?",
    a: "Yes — manage your card and download invoices from the Lemon Squeezy customer portal linked in your receipt email.",
  },
  {
    q: "Is there a team or classroom plan?",
    a: "Not today. QraftPaper is built for one student per account. If you want to share with your study group, send them quiz links — they don't need an account to take a quiz.",
  },
  {
    q: "What if I hit 20 generations before month end?",
    a: "You can still take quizzes, edit existing papers and use blueprints — everything except generating new content. The counter resets on the 1st UTC.",
  },
];

const tier = billingTiers.educator;

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string | string[] }>;
}) {
  const session = await auth();
  const subjects = session?.user?.id
    ? await listUserSubjects(session.user.id)
    : [];
  const streak = session?.user?.id
    ? await getStreakSummary(session.user.id)
    : {
        current: 0,
        longest: 0,
        totalDays: 0,
        practisedToday: false,
        daysSinceLast: null,
      };
  const [subscription] = session?.user?.id
    ? await getDb()
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, session.user.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)
    : [];
  const [profile] = session?.user?.id
    ? await getDb()
        .select({
          name: users.name,
          email: users.email,
          institution: users.institution,
          plan: users.plan,
        })
        .from(users)
        .where(eq(users.id, session.user.id))
        .limit(1)
    : [];

  // Pull the user's generations-this-month so the active-subscriber view can
  // show a real progress ring — a small but psychologically powerful number
  // that reminds them they're getting their money's worth.
  const monthKey = currentUsageMonth();
  const [usageRow] = session?.user?.id
    ? await getDb()
        .select({ generations: usage.generations })
        .from(usage)
        .where(and(eq(usage.userId, session.user.id), eq(usage.month, monthKey)))
        .limit(1)
    : [];
  const usedThisMonth = usageRow?.generations ?? 0;

  const { checkout } = await searchParams;
  const checkoutStatus = Array.isArray(checkout) ? checkout[0] : checkout;
  const currentPlan = profile?.plan ?? session?.user?.plan ?? "unpaid";
  const currentPlanLabel = PLANS[currentPlan as PlanId]?.name ?? "Unpaid";
  const isSubscribed = currentPlan !== "unpaid";
  const monthlyCap = PLANS[currentPlan as PlanId]?.generationsPerMonth ?? 20;
  const usagePct =
    monthlyCap && monthlyCap > 0
      ? Math.min(100, Math.round((usedThisMonth / monthlyCap) * 100))
      : 0;
  const user = {
    name: profile?.name ?? session?.user?.name ?? null,
    email: profile?.email ?? session?.user?.email ?? "",
    institution: profile?.institution ?? session?.user?.institution ?? null,
    initials: deriveInitials(
      profile?.name ?? session?.user?.name,
      profile?.email ?? session?.user?.email,
    ),
  };

  // Lightweight, honest "people-also-here" stat. Pulls real registered count
  // so we never lie. If the number is small, we just don't render it.
  const [studentsRow] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(users);
  const totalStudents = studentsRow?.n ?? 0;
  const showSocialProof = totalStudents >= 25;

  return (
    <div className="min-h-screen lg:pl-[260px]">
      <Sidebar plan={currentPlan} />
      <Topbar
        subjects={subjects}
        user={user}
        plan={currentPlan}
        streak={streak.current}
        practisedToday={streak.practisedToday}
        daysSinceLast={streak.daysSinceLast}
      />
      <main className="px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          {/* ============================================================ */}
          {/*  HERO                                                         */}
          {/* ============================================================ */}
          <section className="relative">
            <div className="pointer-events-none absolute inset-x-0 -top-20 mx-auto h-72 w-[80%] max-w-3xl rounded-full bg-violet/15 blur-[120px]" />

            <div className="relative text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-violet/30 bg-violet/10 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-violet-bright">
                <Sparkles className="h-3 w-3" />
                {isSubscribed ? "Your subscription" : "Solo plan · for one student"}
              </p>
              <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-gradient sm:text-6xl">
                {isSubscribed
                  ? `You're on ${currentPlanLabel}. Keep practising.`
                  : "Cheaper than one tutoring class. Lasts the whole month."}
              </h1>
              {!isSubscribed && (
                <p className="mx-auto mt-5 max-w-xl text-[0.98rem] leading-relaxed text-fg-muted">
                  20 mock papers and quizzes a month, generated from your own
                  syllabus and last year&apos;s papers. Cancel anytime — every
                  generation you make stays yours.
                </p>
              )}

              {showSocialProof && !isSubscribed && (
                <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-tint/[0.03] px-3 py-1.5 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-fg-muted">
                  <span className="relative grid h-2 w-2 place-items-center rounded-full bg-accent">
                    <span className="absolute inset-0 animate-ping rounded-full bg-accent/60" />
                  </span>
                  {totalStudents}+ students practising on QraftPaper
                </p>
              )}
            </div>
          </section>

          {/* ============================================================ */}
          {/*  SUCCESS BANNER                                               */}
          {/* ============================================================ */}
          {checkoutStatus === "success" && (
            <GlassCard className="mt-8 flex items-start gap-3 p-4 ring-1 ring-accent/35">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
              <div>
                <p className="text-sm font-medium">Checkout completed</p>
                <p className="mt-0.5 text-[0.82rem] text-fg-muted">
                  Your plan updates the moment Lemon Squeezy confirms the
                  subscription. Refresh in a few seconds if it hasn&apos;t
                  changed yet.
                </p>
              </div>
            </GlassCard>
          )}

          {/* ============================================================ */}
          {/*  PRICING + VALUE STACK (two-column on lg)                     */}
          {/* ============================================================ */}
          <div className="mt-12 grid items-start gap-6 lg:grid-cols-[1.05fr_1fr]">
            {/* ---- Pricing card ------------------------------------- */}
            <div className="relative overflow-hidden rounded-3xl glass-strong p-8 ring-1 ring-violet/35 sm:p-10">
              <div className="pointer-events-none absolute -top-28 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-violet/20 blur-[80px]" />
              <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet/40 to-transparent" />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-violet-bright">
                    Solo plan · For one student
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Everything to actually prep
                  </h2>
                </div>
                {isSubscribed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-accent">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-gold">
                    <Zap className="h-3 w-3" />
                    Most picked
                  </span>
                )}
              </div>

              <div className="relative mt-7 flex items-end gap-2">
                <span className="text-display-xl text-gradient">
                  {tier.price}
                </span>
                <span className="mb-2 text-base text-fg-subtle">{tier.period}</span>
                {!isSubscribed && (
                  <span className="mb-3 ml-3 inline-flex items-center gap-1 rounded-full border border-accent/35 bg-accent/12 px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-accent">
                    ≈ ₹579 in India
                  </span>
                )}
              </div>
              <p className="relative mt-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-fg-subtle">
                {tier.generationCap} · {PLANS.educator.maxSubjects} subjects ·
                cancel anytime
              </p>

              {/* Mini ROI line — frames $7 in $/paper terms */}
              <p className="relative mt-5 rounded-xl border border-line bg-tint/[0.02] px-4 py-3 text-[0.84rem] leading-snug text-fg-muted">
                <span className="font-medium text-fg">≈ $0.35 per paper.</span>{" "}
                If even one extra mock saves you a grade, it&apos;s paid for
                itself ten times over.
              </p>

              <div className="relative mt-6">
                <CheckoutButton tier={tier.tier}>
                  {isSubscribed
                    ? "Manage subscription"
                    : "Subscribe & start practising"}
                </CheckoutButton>
              </div>

              {/* Trust strip */}
              <div className="relative mt-5 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-4 text-[0.72rem] text-fg-muted sm:grid-cols-4">
                {TRUST_BADGES.map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5">
                    <b.icon className="h-3 w-3 shrink-0 text-violet-bright" />
                    <span className="leading-snug">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ---- Value stack / live usage ------------------------- */}
            {isSubscribed ? (
              <UsageCard
                used={usedThisMonth}
                cap={monthlyCap ?? 20}
                pct={usagePct}
                streak={streak.current}
                longest={streak.longest}
                totalDays={streak.totalDays}
              />
            ) : (
              <ValueStackCard />
            )}
          </div>

          {/* ============================================================ */}
          {/*  COMPARISON TABLE                                             */}
          {/* ============================================================ */}
          {!isSubscribed && <ComparisonTable />}

          {/* ============================================================ */}
          {/*  BENEFITS                                                     */}
          {/* ============================================================ */}
          <section className="mt-16">
            <div className="text-center">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
                What you actually get
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Six things that make {tier.price}/mo feel cheap
              </h3>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((b) => (
                <div
                  key={b.title}
                  className="group relative overflow-hidden rounded-2xl border border-line bg-tint/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-violet/35 hover:bg-tint/[0.04]"
                >
                  <span className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-violet/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet/10 text-violet-bright ring-1 ring-violet/25">
                    <b.icon className="h-[18px] w-[18px]" />
                  </span>
                  <p className="mt-4 text-[0.95rem] font-medium">{b.title}</p>
                  <p className="mt-1.5 text-[0.82rem] leading-relaxed text-fg-muted">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ============================================================ */}
          {/*  SUBSCRIPTION DETAILS (paid users only)                      */}
          {/* ============================================================ */}
          {isSubscribed && subscription && (
            <section className="mt-14 rounded-3xl border border-line bg-tint/[0.02] p-7">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
                Subscription details
              </p>
              <dl className="mt-4 grid gap-3 text-[0.88rem] sm:grid-cols-3">
                <div>
                  <dt className="text-fg-muted">Status</dt>
                  <dd
                    className={cn(
                      "mt-0.5 font-mono capitalize",
                      subscription.status === "active"
                        ? "text-accent"
                        : "text-gold",
                    )}
                  >
                    {subscription.status}
                  </dd>
                </div>
                {subscription.renewsAt && (
                  <div>
                    <dt className="text-fg-muted">Renews</dt>
                    <dd className="mt-0.5 font-mono text-fg">
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(subscription.renewsAt)}
                    </dd>
                  </div>
                )}
                {subscription.endsAt && (
                  <div>
                    <dt className="text-fg-muted">Ends</dt>
                    <dd className="mt-0.5 font-mono text-fg">
                      {new Intl.DateTimeFormat("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).format(subscription.endsAt)}
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* ============================================================ */}
          {/*  FAQ                                                          */}
          {/* ============================================================ */}
          <section className="mt-16">
            <div className="text-center">
              <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
                Common questions
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Before you subscribe
              </h3>
            </div>
            <div className="mt-8 grid gap-3 lg:grid-cols-2">
              {FAQ_ITEMS.map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </section>

          {/* ============================================================ */}
          {/*  FINAL CTA                                                    */}
          {/* ============================================================ */}
          {!isSubscribed && (
            <section className="relative mt-16 mb-4 overflow-hidden rounded-3xl glass-strong p-8 text-center ring-1 ring-violet/30 sm:p-12">
              <span className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-violet/40 to-transparent" />
              <h3 className="mx-auto max-w-2xl text-balance text-2xl font-semibold tracking-tight text-gradient sm:text-3xl">
                Stop bookmarking PYQs. Start writing them.
              </h3>
              <p className="mx-auto mt-3 max-w-md text-[0.92rem] text-fg-muted">
                Your first paper takes ~90 seconds to generate. Be solving one
                two minutes from now.
              </p>
              <div className="mx-auto mt-6 max-w-xs">
                <CheckoutButton tier={tier.tier}>
                  Start practising
                </CheckoutButton>
              </div>
              <p className="mt-4 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-fg-subtle">
                Lemon Squeezy · INR & USD · cancel anytime
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Usage card — shown to paid subscribers in the right column. Pulls
 *  the real `usage.generations` row for this UTC month so the ring is
 *  a true representation. Below the ring we surface streak stats so
 *  the page doubles as a "you're getting your money's worth" reminder.
 * ------------------------------------------------------------------ */
function UsageCard({
  used,
  cap,
  pct,
  streak,
  longest,
  totalDays,
}: {
  used: number;
  cap: number;
  pct: number;
  streak: number;
  longest: number;
  totalDays: number;
}) {
  const remaining = Math.max(0, cap - used);
  // SVG progress ring math: 2πr with r=44 → ~276.46
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference * (1 - pct / 100);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-tint/[0.02] p-7">
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
        This month
      </p>

      <div className="mt-5 flex items-center gap-6">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-line"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="text-accent transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-2xl font-semibold tracking-tight">{used}</p>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-fg-subtle">
                of {cap}
              </p>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {remaining > 0
              ? `${remaining} generations left this cycle`
              : "Allowance fully used"}
          </p>
          <p className="mt-1 text-[0.8rem] leading-snug text-fg-muted">
            Counter resets on the 1st UTC. Existing papers and quizzes stay
            usable regardless.
          </p>
        </div>
      </div>

      <div className="mt-7 grid grid-cols-3 gap-2 border-t border-line pt-5">
        <Stat icon={Flame} value={streak} label="Day streak" tone="gold" />
        <Stat icon={Target} value={longest} label="Longest" tone="violet" />
        <Stat icon={InfinityIcon} value={totalDays} label="Total days" tone="accent" />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Flame;
  value: number;
  label: string;
  tone: "gold" | "violet" | "accent";
}) {
  return (
    <div className="text-center">
      <span
        className={cn(
          "mx-auto grid h-8 w-8 place-items-center rounded-lg ring-1",
          tone === "gold" && "bg-gold/15 text-gold ring-gold/30",
          tone === "violet" && "bg-violet/15 text-violet-bright ring-violet/30",
          tone === "accent" && "bg-accent/15 text-accent ring-accent/30",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 font-mono text-lg font-semibold tracking-tight">
        {value}
      </p>
      <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-fg-subtle">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Value-stack card — shown to unpaid visitors. Reframes $7 against
 *  things they recognise (tutoring, booklets, generic AI).
 * ------------------------------------------------------------------ */
function ValueStackCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-tint/[0.02] p-7">
      <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
        What you&apos;d otherwise spend
      </p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight">
        Stack the value, not the cost.
      </h3>
      <ul className="mt-5 flex flex-col gap-3">
        {VALUE_STACK.map((v) => (
          <li
            key={v.label}
            className="flex items-center gap-3 rounded-xl border border-line bg-tint/[0.02] p-3"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-tint/[0.04] text-fg-muted ring-1 ring-line">
              <v.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.86rem] font-medium">{v.label}</p>
              <p className="mt-0.5 text-[0.74rem] text-fg-muted">{v.note}</p>
            </div>
            <span className="font-mono text-[0.78rem] font-semibold tracking-tight text-fg">
              {v.cost}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/[0.08] p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/20 text-accent ring-1 ring-accent/40">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.86rem] font-medium">QraftPaper Solo</p>
          <p className="mt-0.5 text-[0.74rem] text-fg-muted">
            Everything above, one subscription, your syllabus.
          </p>
        </div>
        <span className="font-mono text-[0.86rem] font-semibold tracking-tight text-accent">
          $7/mo
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Comparison strip — visible only to unpaid users. Honest, generic
 *  alternatives ("Generic AI", "PYQ textbook") so we don't make claims
 *  about named competitors.
 * ------------------------------------------------------------------ */
function ComparisonTable() {
  return (
    <section className="mt-16">
      <div className="text-center">
        <p className="font-mono text-[0.66rem] uppercase tracking-[0.2em] text-fg-subtle">
          How it stacks up
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          The full picture
        </h3>
      </div>

      <div className="mt-7 overflow-hidden rounded-2xl border border-line bg-tint/[0.02]">
        <table className="w-full text-left text-[0.84rem]">
          <thead className="bg-tint/[0.04]">
            <tr className="border-b border-line">
              <th className="px-4 py-3.5 font-medium text-fg-muted">Feature</th>
              <th className="px-4 py-3.5 font-medium text-violet-bright">
                QraftPaper
              </th>
              <th className="px-4 py-3.5 font-medium text-fg-subtle">
                Generic AI
              </th>
              <th className="hidden px-4 py-3.5 font-medium text-fg-subtle sm:table-cell">
                PYQ textbook
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((r, i) => (
              <tr
                key={r.label}
                className={cn(
                  "border-b border-line/60 last:border-b-0",
                  i % 2 === 1 && "bg-tint/[0.015]",
                )}
              >
                <td className="px-4 py-3 text-fg">{r.label}</td>
                <td className="px-4 py-3">
                  <Cell value={r.qraftpaper} accent />
                </td>
                <td className="px-4 py-3">
                  <Cell value={r.generic} />
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Cell value={r.textbook} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-center font-mono text-[0.62rem] uppercase tracking-[0.16em] text-fg-subtle">
        Honest comparison · No competitor names · No fake reviews
      </p>
    </section>
  );
}

function Cell({
  value,
  accent = false,
}: {
  value: string | boolean;
  accent?: boolean;
}) {
  if (value === true) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-medium",
          accent ? "text-accent" : "text-fg-muted",
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
        Yes
      </span>
    );
  }
  if (value === false) {
    return <span className="font-mono text-[0.78rem] text-fg-subtle">—</span>;
  }
  return (
    <span
      className={cn(
        "font-mono text-[0.8rem]",
        accent ? "font-semibold text-accent" : "text-fg-muted",
      )}
    >
      {value}
    </span>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-line bg-tint/[0.02] p-5 transition-colors hover:border-line-strong">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[0.92rem] font-medium">
        <span className="flex items-start gap-2">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-bright" />
          {q}
        </span>
        <Clock className="mt-1 h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-200 group-open:rotate-90" />
      </summary>
      <p className="mt-3 text-[0.82rem] leading-relaxed text-fg-muted">{a}</p>
    </details>
  );
}
