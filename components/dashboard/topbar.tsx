"use client";

import { Plus } from "lucide-react";
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
  if (pathname.startsWith("/dashboard/team")) return "Team";
  if (pathname.startsWith("/dashboard/settings")) return "Settings";
  if (pathname.startsWith("/billing")) return "Billing";
  return "Overview";
}

export function Topbar({
  subjects,
  user,
  plan = "unpaid",
}: {
  subjects: DashboardSubject[];
  user: DashboardUser;
  plan?: string;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const title = pageTitleFor(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-canvas/70 px-5 backdrop-blur-xl sm:px-8">
      <div className="flex items-center gap-3">
        <MobileNav plan={plan} />
        <p className="text-sm font-medium">{title}</p>
        <span className="hidden h-4 w-px bg-line sm:block" />
        <p className="hidden truncate font-mono text-[0.7rem] uppercase tracking-[0.16em] text-fg-subtle sm:block">
          Workspace
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <CommandPalette subjects={subjects} />
        <ThemeToggle />
        <Notifications />
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
