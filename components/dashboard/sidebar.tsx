"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Check, Rocket } from "lucide-react";
import { Logo } from "@/components/logo";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { accountNav, type NavItem, workspaceNav } from "@/lib/dashboard-nav";

export function Sidebar({
  plan,
  subjectCount = 0,
}: {
  plan: string;
  /** How many subjects the user has — drives the getting-started tracker so the
   *  card celebrates progress instead of nagging "Subscribe" mid-upload. */
  subjectCount?: number;
}) {
  const pathname = usePathname();
  // Only nudge users who haven't subscribed; paid Educator/Department users
  // shouldn't see an onboarding card on every page.
  const showOnboarding = plan === "unpaid";

  return (
    <motion.aside
      initial={{ x: -280, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: easeOut }}
      className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-line bg-panel/70 backdrop-blur-xl lg:flex"
    >
      <div className="flex h-16 items-center border-b border-line px-6">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        <NavGroup label="Workspace" items={workspaceNav} pathname={pathname} />
        <NavGroup label="Account" items={accountNav} pathname={pathname} />
      </nav>

      {showOnboarding && (
        <div className="px-4 pb-6">
          <GettingStartedCard hasSubjects={subjectCount > 0} />
        </div>
      )}
    </motion.aside>
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
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet/18 blur-2xl" />

      <div className="relative flex items-center justify-between">
        <IconTile icon={Rocket} size="sm" tone="violet" />
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-fg-subtle">
          {doneCount}/{steps.length}
        </span>
      </div>

      <p className="relative mt-3 text-sm font-medium">Getting started</p>

      <ol className="relative mt-3 flex flex-col gap-2">
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
      <div className="relative mt-3 h-1 w-full overflow-hidden rounded-full bg-tint/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet to-gold transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <GlowButton href={cta.href} size="sm" className="relative mt-3.5 w-full">
        {cta.label}
        <ArrowRight className="h-3.5 w-3.5" />
      </GlowButton>
      <p className="relative mt-2 text-center text-[0.68rem] leading-snug text-fg-subtle">
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
