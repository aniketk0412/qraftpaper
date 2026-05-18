"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import {
  CreditCard,
  LifeBuoy,
  LogOut,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

const menu: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: UserRound, label: "Profile", href: "#" },
  { icon: Settings, label: "Workspace settings", href: "#" },
  { icon: CreditCard, label: "Billing & plan", href: "/billing" },
  { icon: LifeBuoy, label: "Help & support", href: "#" },
];

export interface DashboardUser {
  name: string | null;
  email: string;
  institution: string | null;
  initials: string;
}

export function UserMenu({ user }: { user: DashboardUser }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full bg-card-hi font-mono text-xs font-medium text-fg ring-1 transition-colors",
          open ? "ring-accent/40" : "ring-line hover:ring-line-strong",
        )}
        aria-label="Account menu"
      >
        {user.initials}
      </button>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            key="user-menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: easeOut }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line-strong bg-card-hi shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card-hi font-mono text-xs font-medium text-fg ring-1 ring-line">
                {user.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {user.name ?? "Your account"}
                </p>
                <p className="truncate text-[0.74rem] text-fg-subtle">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="p-1.5">
              {menu.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[0.84rem] text-fg-muted transition-colors hover:bg-white/[0.04] hover:text-fg"
                >
                  <item.icon className="h-[18px] w-[18px] text-fg-subtle" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-line p-1.5">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void signOut({ redirectTo: "/" });
                }}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[0.84rem] text-fg-muted transition-colors hover:bg-white/[0.04] hover:text-fg"
              >
                <LogOut className="h-[18px] w-[18px] text-fg-subtle" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
