"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { accountNav, type NavItem, workspaceNav } from "@/lib/dashboard-nav";

export function Sidebar({ plan }: { plan: string }) {
  const pathname = usePathname();
  // Only nudge users who haven't subscribed; paid Educator/Department users
  // shouldn't see a "Trial access · Subscribe" card on every page.
  const showUpgradeCard = plan === "unpaid";

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

      {showUpgradeCard && (
        <div className="px-4 pb-6">
          <div className="relative overflow-hidden rounded-2xl glass-strong p-4">
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet/18 blur-2xl" />
            <IconTile icon={Sparkles} size="sm" className="relative" />
            <p className="relative mt-3 text-sm font-medium">Subscribe to generate</p>
            <p className="relative mt-1 text-[0.78rem] leading-snug text-fg-muted">
              Generation unlocks once you subscribe to a plan — every plan
              includes a monthly allowance.
            </p>
            <GlowButton href="/billing" size="sm" className="relative mt-3 w-full">
              Subscribe
            </GlowButton>
          </div>
        </div>
      )}
    </motion.aside>
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
