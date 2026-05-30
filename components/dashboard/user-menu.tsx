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
import { useEffect, useRef, useState } from "react";
import { easeOut } from "@/lib/motion";
import { supportEmail } from "@/lib/site";
import { cn } from "@/lib/utils";

// One row per destination — no duplicate "Profile" + "Workspace settings"
// that both went to /dashboard/settings. Account first, then billing, then
// support.
const menu: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: Settings, label: "Account & profile", href: "/dashboard/settings" },
  { icon: CreditCard, label: "Billing & plan", href: "/billing" },
  { icon: LifeBuoy, label: "Help & support", href: `mailto:${supportEmail}` },
];

export interface DashboardUser {
  name: string | null;
  email: string;
  institution: string | null;
  initials: string;
}

export function UserMenu({ user }: { user: DashboardUser }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "grid h-10 w-10 place-items-center rounded-full bg-card-hi font-mono text-[0.78rem] font-semibold tracking-wide text-fg ring-1 transition-colors",
          open ? "ring-accent/40" : "ring-line hover:ring-line-strong",
        )}
        aria-label="Account menu"
      >
        {/* Show the user's real initials when we have them — feels like a real
            product. Falls back to the generic icon only when initials end up
            empty (shouldn't happen — deriveInitials always returns something). */}
        {user.initials ? (
          <span aria-hidden>{user.initials}</span>
        ) : (
          <UserRound className="h-5 w-5" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="user-menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: easeOut }}
            className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-line-strong bg-card-hi/80 shadow-2xl backdrop-blur-2xl"
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
                  className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-[0.84rem] text-fg-muted transition-colors hover:bg-tint/[0.04] hover:text-fg"
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
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-[0.84rem] text-fg-muted transition-colors hover:bg-tint/[0.04] hover:text-fg"
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
