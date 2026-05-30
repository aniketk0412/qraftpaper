"use client";

import { Flame, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlowButton } from "@/components/ui/glow-button";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { Notifications } from "@/components/dashboard/notifications";
import { UserMenu, type DashboardUser } from "@/components/dashboard/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import type { DashboardSubject } from "@/lib/subjects";

// Map the current pathname to a short page label so the topbar reflects which
// page you're on. Defaults to "Overview" for the bare /dashboard.
function pageTitleFor(pathname: string): string {
  if (pathname.startsWith("/dashboard/subjects/new")) return "New subject";
  if (pathname.startsWith("/dashboard/subjects")) return "Subjects";
  if (pathname.startsWith("/dashboard/papers")) return "Question papers";
  if (pathname.startsWith("/dashboard/blueprints")) return "Blueprints";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  if (pathname.startsWith("/billing")) return "Billing";
  return "Overview";
}

export function Topbar({
  subjects,
  user,
  plan = "unpaid",
  streak = 0,
  practisedToday = false,
  daysSinceLast = null,
}: {
  subjects: DashboardSubject[];
  user: DashboardUser;
  plan?: string;
  streak?: number;
  practisedToday?: boolean;
  daysSinceLast?: number | null;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const title = pageTitleFor(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-canvas/85 px-5 backdrop-blur-md sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav plan={plan} />
        <p className="shrink-0 text-sm font-medium">{title}</p>
        <span className="hidden h-4 w-px bg-line sm:block" />
        {/* Show the user's institution if we have one, otherwise the generic
            "Workspace" label — so a real subscriber sees "Overview · Parul
            University" instead of "Overview · Workspace". */}
        <p className="hidden min-w-0 truncate font-mono text-[0.7rem] uppercase tracking-[0.16em] text-fg-subtle sm:block">
          {user.institution || "Study workspace"}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {streak > 0 && (
          // Persistent streak badge — visible from every dashboard page so
          // users keep getting reminded of the streak they're maintaining.
          // Dimmed when they haven't practised today (gentle "do something"
          // cue). Visible on mobile too because habit-app research is loud
          // about one thing: the streak counter is the highest-leverage UI
          // pixel; hiding it on the device people actually use is malpractice.
          <Link
            href="/dashboard"
            aria-label={`${streak}-day streak`}
            className={
              practisedToday
                ? "inline-flex h-10 items-center gap-1.5 rounded-full border border-gold/40 bg-gold/15 px-3 font-mono text-[0.78rem] font-medium text-gold transition-colors hover:bg-gold/20"
                : "inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-tint/[0.03] px-3 font-mono text-[0.78rem] font-medium text-fg-muted transition-colors hover:text-fg"
            }
          >
            <Flame
              className={
                practisedToday ? "h-3.5 w-3.5 text-gold" : "h-3.5 w-3.5"
              }
            />
            {streak}
          </Link>
        )}
        <CommandPalette subjects={subjects} />
        <ThemeToggle />
        <Notifications
          subjects={subjects}
          streak={streak}
          practisedToday={practisedToday}
          daysSinceLast={daysSinceLast}
        />
        <GlowButton
          href="/dashboard/subjects/new"
          size="md"
          className="hidden sm:inline-flex"
        >
          <Plus className="h-4 w-4" />
          New subject
        </GlowButton>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
