"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  CheckCheck,
  FileText,
  ListChecks,
  Ruler,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  time: string;
}

const seed: Note[] = [
  {
    id: "n1",
    icon: FileText,
    title: "End-Semester paper generated",
    detail: "Data Structures & Algorithms · 70 marks",
    time: "2h ago",
  },
  {
    id: "n2",
    icon: ListChecks,
    title: "Quiz ready for review",
    detail: "Signals & Systems · 12 questions",
    time: "5h ago",
  },
  {
    id: "n3",
    icon: Ruler,
    title: "Blueprint shared with you",
    detail: "Prof. Mensah · Unit Test template",
    time: "Yesterday",
  },
  {
    id: "n4",
    icon: Sparkles,
    title: "Originality check complete",
    detail: "Thermodynamics · no overlaps found",
    time: "2d ago",
  },
];

export function Notifications() {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Record<string, boolean>>({});
  const rootRef = useRef<HTMLDivElement>(null);

  const unread = seed.filter((n) => !read[n.id]).length;

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
            className="absolute right-0 top-full z-50 mt-2 w-[21rem] overflow-hidden rounded-2xl border border-line-strong bg-card-hi/80 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-medium">Notifications</p>
              {unread > 0 && (
                <button
                  onClick={() => setRead(Object.fromEntries(seed.map((n) => [n.id, true])))}
                  className="flex items-center gap-1.5 text-[0.74rem] text-accent transition-colors hover:text-accent-soft"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div
              data-lenis-prevent
              className="max-h-[20rem] overflow-y-auto overscroll-contain p-1.5"
            >
              {seed.map((n) => {
                const isRead = read[n.id];
                return (
                  <button
                    key={n.id}
                    onClick={() => setRead((r) => ({ ...r, [n.id]: true }))}
                    className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-tint/[0.04]"
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1",
                        isRead
                          ? "bg-tint/[0.03] text-fg-subtle ring-line"
                          : "bg-accent/15 text-accent ring-accent/30",
                      )}
                    >
                      <n.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block text-[0.82rem] font-medium leading-snug",
                          isRead && "text-fg-muted",
                        )}
                      >
                        {n.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[0.74rem] text-fg-subtle">
                        {n.detail}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                      {n.time}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
