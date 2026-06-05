"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Check, Rocket, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { Confetti } from "@/components/ui/confetti";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { describeGenerationUsage } from "@/lib/generation-usage";
import { easeOut } from "@/lib/motion";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { accountNav, type NavItem, workspaceNav } from "@/lib/dashboard-nav";

export function Sidebar({
  plan,
  subjectCount = 0,
  generationsUsed = 0,
  generationsCap = null,
}: {
  plan: string;
  /** How many subjects the user has — drives the getting-started tracker so the
   *  card celebrates progress instead of nagging "Subscribe" mid-upload. */
  subjectCount?: number;
  /** Generations used this month (paid plans) for the live usage card. */
  generationsUsed?: number;
  /** Monthly cap; null = unlimited. */
  generationsCap?: number | null;
}) {
  const pathname = usePathname();
  const isPaid = plan !== "unpaid";

  return (
    <motion.aside
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: easeOut }}
      className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-line bg-ink lg:flex"
    >
      <div className="flex h-16 items-center border-b border-line px-6">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        <NavGroup label="Workspace" items={workspaceNav} pathname={pathname} />
        <NavGroup label="Account" items={accountNav} pathname={pathname} />
      </nav>

      <div className="px-4 pb-6">
        {isPaid ? (
          <UsageCard plan={plan} used={generationsUsed} cap={generationsCap} />
        ) : (
          <GettingStartedCard hasSubjects={subjectCount > 0} />
        )}
      </div>
    </motion.aside>
  );
}

/**
 * Live monthly-usage card for paid users — replaces the onboarding tracker once
 * someone is on a plan. Shows their plan, generations used vs. their cap (or
 * "Unlimited"), and a "Generate" button that deep-links into the dashboard's
 * generation panel.
 */
function UsageCard({
  plan,
  used,
  cap,
}: {
  plan: string;
  used: number;
  cap: number | null;
}) {
  const planName = PLANS[plan as PlanId]?.name ?? "Your plan";
  const u = describeGenerationUsage(used, cap);
  const warn = u.level === "low" || u.level === "exhausted";

  return (
    <div className="relative overflow-hidden rounded-2xl glass-strong p-4">
      <div className="flex items-center justify-between">
        <IconTile icon={Sparkles} size="sm" tone="violet" />
        <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-mono text-[0.56rem] uppercase tracking-wider text-gold">
          {planName}
        </span>
      </div>

      <p className="mt-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-fg-subtle">
        Generations this month
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
        {u.used}
        <span className="text-base font-medium text-fg-subtle">
          {u.cap === null ? " used" : `/${u.cap}`}
        </span>
      </p>

      {u.cap !== null && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-tint/[0.06]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              warn ? "bg-gold" : "bg-gradient-to-r from-violet to-accent",
            )}
            style={{ width: `${Math.max(u.pct, u.used > 0 ? 6 : 0)}%` }}
          />
        </div>
      )}

      <p className="mt-2 text-[0.72rem] leading-snug text-fg-muted">
        {u.cap === null
          ? "Unlimited generations on your plan."
          : u.remaining === 0
            ? "You've used this month's allowance — it resets next month."
            : `${u.remaining} left this month.`}
      </p>

      {/* Upgrade nudge — only when genuinely low or out (decided by
          describeGenerationUsage, never for unlimited or comfortable plans). */}
      {warn && (
        <Link
          href="/billing"
          className="mt-2.5 inline-flex items-center gap-1 text-[0.72rem] font-medium text-gold underline-offset-2 hover:underline"
        >
          {u.level === "exhausted" ? "Upgrade for more" : "Running low — upgrade"}
          <ArrowRight className="h-3 w-3" />
        </Link>
      )}

      <GlowButton href="/dashboard#generate" size="sm" className="mt-3.5 w-full">
        Generate
        <ArrowRight className="h-3.5 w-3.5" />
      </GlowButton>
    </div>
  );
}

/**
 * An adaptive 3-step onboarding tracker that replaces the old flat "Subscribe"
 * nag. Adding a subject is free, so for a brand-new user it leads with that —
 * the discouraging "Subscribe" only becomes the headline action once step 1 is
 * actually done. Shows visible progress so the card feels like momentum, not a
 * paywall.
 */
function GettingStartedCard({ hasSubjects }: { hasSubjects: boolean }) {
  // Fire a small one-time confetti the first time step 1 is complete (a subject
  // exists). localStorage-guarded so it celebrates the milestone exactly once,
  // never on every dashboard visit.
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (!hasSubjects || typeof window === "undefined") return;
    const KEY = "qp_first_subject_celebrated";
    if (localStorage.getItem(KEY)) return;
    localStorage.setItem(KEY, "1");
    // Intentional: a one-time celebration fired after hydration from a
    // client-only localStorage check (doing it in render would cause an SSR
    // mismatch). Runs at most once per browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCelebrate(true);
  }, [hasSubjects]);

  const steps = [
    { label: "Add your first subject", done: hasSubjects, free: true },
    { label: "Subscribe to generate", done: false, free: false },
    { label: "Create papers & quizzes", done: false, free: false },
  ];
  const currentIndex = hasSubjects ? 1 : 0;
  const doneCount = steps.filter((s) => s.done).length;

  const cta = hasSubjects
    ? {
        href: "/billing",
        label: "Subscribe to generate",
        sub: "Every plan includes a monthly allowance.",
      }
    : {
        href: "/dashboard/subjects/new",
        label: "Add a subject",
        sub: "It's free — no card needed.",
      };

  return (
    <div className="relative overflow-hidden rounded-2xl glass-strong p-4">
      {celebrate && <Confetti particleCount={18} durationMs={1800} />}

      <div className="flex items-center justify-between">
        <IconTile icon={Rocket} size="sm" tone="violet" />
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-fg-subtle">
          {doneCount}/{steps.length}
        </span>
      </div>

      <p className="mt-3 text-sm font-medium">Getting started</p>

      <ol className="mt-3 flex flex-col gap-2">
        {steps.map((step, i) => {
          const current = i === currentIndex;
          return (
            <li key={step.label} className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[0.6rem] font-medium ring-1 transition-colors",
                  step.done
                    ? "bg-accent/20 text-accent ring-accent/40"
                    : current
                      ? "bg-violet/20 text-violet-bright ring-violet/45"
                      : "text-fg-subtle ring-line",
                )}
              >
                {step.done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  "text-[0.78rem] leading-snug",
                  step.done
                    ? "text-fg-muted line-through decoration-fg-subtle/40"
                    : current
                      ? "font-medium text-fg"
                      : "text-fg-muted",
                )}
              >
                {step.label}
                {step.free && !step.done && (
                  <span className="ml-1.5 rounded-full bg-accent/15 px-1.5 py-0.5 align-middle font-mono text-[0.52rem] uppercase tracking-wider text-accent">
                    Free
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Progress bar — same data as the n/3 badge, read at a glance. */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-tint/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet to-gold transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <GlowButton href={cta.href} size="sm" className="mt-3.5 w-full">
        {cta.label}
        <ArrowRight className="h-3.5 w-3.5" />
      </GlowButton>
      <p className="mt-2 text-center text-[0.68rem] leading-snug text-fg-subtle">
        {cta.sub}
      </p>
    </div>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 pb-1.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-fg-subtle">
        {label}
      </p>
      {items.map((item) => {
        const active = item.href === pathname;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
              active
                ? "bg-accent/15 text-fg ring-1 ring-accent/30"
                : "text-fg-muted hover:bg-tint/[0.04] hover:text-fg",
            )}
          >
            <item.icon
              className={cn(
                "h-[18px] w-[18px] transition-colors",
                active
                  ? "text-accent"
                  : "text-fg-subtle group-hover:text-fg-muted",
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
