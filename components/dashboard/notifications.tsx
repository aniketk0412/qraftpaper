"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CalendarClock,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { easeOut } from "@/lib/motion";
import type { DashboardSubject } from "@/lib/subjects";
import { cn } from "@/lib/utils";

interface Notice {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  href?: string;
  tone: "info" | "warn" | "fire";
}

/**
 * Auto-composed notification feed from current account state. We do not have
 * a notifications table — these are derived live from streak + subjects so
 * they always reflect reality without needing a worker to fire writes.
 *
 *   - 2+ days since last activity → "Don't lose your streak" warn-tone
 *   - Any subject with examDate within 7 days → "Exam in N days" warn-tone
 *   - Practised today on a current streak → "Streak day N saved" info-tone
 */
function buildNotices({
  streak,
  practisedToday,
  daysSinceLast,
  subjects,
}: {
  streak: number;
  practisedToday: boolean;
  daysSinceLast: number | null;
  subjects: DashboardSubject[];
}): Notice[] {
  const out: Notice[] = [];

  // Exam countdowns (one entry per subject with an upcoming exam within 14d)
  const upcoming = subjects
    .filter(
      (s) =>
        s.daysToExam !== null && s.daysToExam >= 0 && s.daysToExam <= 14,
    )
    .sort((a, b) => (a.daysToExam ?? 0) - (b.daysToExam ?? 0));

  for (const subject of upcoming) {
    const days = subject.daysToExam ?? 0;
    out.push({
      id: `exam-${subject.id}`,
      icon: CalendarClock,
      title:
        days === 0
          ? `${subject.code} exam today`
          : days === 1
            ? `${subject.code} exam tomorrow`
            : `${subject.code} in ${days} days`,
      body:
        days <= 3
          ? "Time to cram. Generate a final mock paper and rip through it."
          : "Within striking distance. Practise a paper a day until then.",
      href: "/dashboard/subjects",
      tone: "warn",
    });
  }

  // Streak nudges
  if (streak > 0 && !practisedToday) {
    out.push({
      id: "streak-keep",
      icon: Flame,
      title: `Don't break your ${streak}-day streak`,
      body: "Do anything today — generate a paper, take a quiz, regen a question — and the streak holds.",
      tone: "warn",
    });
  }
  if (daysSinceLast !== null && daysSinceLast >= 2) {
    out.push({
      id: "miss",
      icon: AlertTriangle,
      title: `${daysSinceLast} days since you last practised`,
      body: "Two days is when most students fall off. Take one MCQ now and you're back.",
      tone: "warn",
    });
  }
  if (practisedToday && streak > 0) {
    out.push({
      id: "streak-done",
      icon: Flame,
      title: `Day ${streak} of your streak locked in`,
      body: "Already counted for today. See you tomorrow.",
      tone: "fire",
    });
  }

  return out;
}

export function Notifications({
  subjects = [],
  streak = 0,
  practisedToday = false,
  daysSinceLast = null,
}: {
  subjects?: DashboardSubject[];
  streak?: number;
  practisedToday?: boolean;
  daysSinceLast?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const notices = buildNotices({
    streak,
    practisedToday,
    daysSinceLast,
    subjects,
  });
  // "Unread" counts only the actionable ones (warn) — the success "day N
  // locked in" is satisfying but not a thing to act on.
  const unread = notices.filter((n) => n.tone !== "fire").length;

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
          "relative grid h-10 w-10 place-items-center rounded-full glass transition-colors",
          open ? "text-fg" : "text-fg-muted hover:text-fg",
        )}
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute right-2 top-2 grid h-3.5 w-3.5 place-items-center rounded-full bg-accent text-[0.5rem] font-bold text-on-accent ring-2 ring-canvas">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="notif"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: easeOut }}
            className="absolute right-0 top-full z-50 mt-2 w-[22rem] overflow-hidden rounded-2xl border border-line-strong bg-card-hi/80 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-medium">Notifications</p>
              {notices.length > 0 && (
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-fg-subtle">
                  {notices.length} active
                </span>
              )}
            </div>

            {notices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-tint/[0.04] text-fg-subtle ring-1 ring-line">
                  <BellOff className="h-4 w-4" />
                </span>
                <p className="text-[0.82rem] font-medium text-fg">
                  All clear
                </p>
                <p className="max-w-[16rem] text-[0.74rem] leading-snug text-fg-subtle">
                  Set an exam date on a subject or start a streak and we&apos;ll
                  light this up.
                </p>
              </div>
            ) : (
              <ul className="flex max-h-[26rem] flex-col overflow-y-auto p-1.5">
                {notices.map((n) => {
                  const inner = (
                    <div className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-tint/[0.04]">
                      <span
                        className={cn(
                          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1",
                          n.tone === "warn" &&
                            "bg-gold/15 text-gold ring-gold/30",
                          n.tone === "fire" &&
                            "bg-gold/15 text-gold ring-gold/30",
                          n.tone === "info" &&
                            "bg-accent/15 text-accent ring-accent/30",
                        )}
                      >
                        <n.icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 leading-snug">
                        <p className="text-[0.82rem] font-medium">{n.title}</p>
                        <p className="mt-0.5 text-[0.74rem] text-fg-muted">
                          {n.body}
                        </p>
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.href ? (
                        <Link
                          href={n.href}
                          onClick={() => setOpen(false)}
                          className="block text-left"
                        >
                          {inner}
                        </Link>
                      ) : (
                        inner
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
