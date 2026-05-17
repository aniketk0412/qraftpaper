"use client";

import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  CornerDownLeft,
  FilePlus2,
  LayoutDashboard,
  ListChecks,
  Ruler,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { easeOut } from "@/lib/motion";
import type { DashboardSubject } from "@/lib/subjects";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  sub: string;
  icon: LucideIcon;
  href: string;
  group: string;
}

const actionItems: CommandItem[] = [
  {
    id: "act-subject",
    label: "Create a subject",
    sub: "Upload source PDFs",
    icon: BookOpen,
    href: "/dashboard/subjects/new",
    group: "Actions",
  },
  {
    id: "act-paper",
    label: "Generate a question paper",
    sub: "Open the paper editor",
    icon: FilePlus2,
    href: "/papers/demo",
    group: "Actions",
  },
  {
    id: "act-quiz",
    label: "Generate a quiz",
    sub: "Open the quiz workspace",
    icon: ListChecks,
    href: "/quiz",
    group: "Actions",
  },
  {
    id: "act-overview",
    label: "Go to overview",
    sub: "Workspace dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    group: "Actions",
  },
  {
    id: "act-blueprints",
    label: "Browse blueprints",
    sub: "Reusable exam templates",
    icon: Ruler,
    href: "#",
    group: "Actions",
  },
];

export function CommandPalette({
  subjects,
}: {
  subjects: DashboardSubject[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = useMemo<CommandItem[]>(() => {
    const subjectItems = subjects.map((s) => ({
      id: `sub-${s.id}`,
      label: s.name,
      sub: `${s.code} · ${s.papers} papers`,
      icon: BookOpen,
      href: "/dashboard",
      group: "Subjects",
    }));

    return [...subjectItems, ...actionItems];
  }, [subjects]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q),
    );
  }, [allItems, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const select = useCallback(
    (item: CommandItem | undefined) => {
      if (!item) return;
      close();
      if (item.href !== "#") router.push(item.href);
    },
    [close, router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => {
        clearTimeout(t);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      select(results[activeIndex]);
    } else if (e.key === "Escape") {
      close();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-full glass px-3.5 py-2 text-fg-subtle transition-colors hover:text-fg-muted md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="w-44 text-left text-sm">Search subjects, papers…</span>
        <kbd className="rounded border border-line bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.6rem]">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="grid h-10 w-10 place-items-center rounded-full glass text-fg-muted transition-colors hover:text-fg md:hidden"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="cmd"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[14vh]"
              >
                <div
                  className="absolute inset-0 bg-ink/70 backdrop-blur-md"
                  onClick={close}
                />
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: easeOut }}
                  onKeyDown={onListKey}
                  className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line-strong bg-card-hi shadow-2xl"
                >
                  <div className="flex items-center gap-3 border-b border-line px-4">
                    <Search className="h-4 w-4 shrink-0 text-fg-subtle" />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setActiveIndex(0);
                      }}
                      placeholder="Search subjects, papers and actions…"
                      className="w-full bg-transparent py-4 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
                    />
                    <kbd className="rounded border border-line bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.6rem] text-fg-subtle">
                      ESC
                    </kbd>
                  </div>

                  <div className="max-h-[19rem] overflow-y-auto p-2">
                    {results.length === 0 && (
                      <p className="px-3 py-8 text-center text-sm text-fg-subtle">
                        No matches for “{query}”.
                      </p>
                    )}
                    {["Subjects", "Actions"].map((group) => {
                      const groupItems = results.filter(
                        (r) => r.group === group,
                      );
                      if (groupItems.length === 0) return null;
                      return (
                        <div key={group} className="mb-1">
                          <p className="px-3 pb-1 pt-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-fg-subtle">
                            {group}
                          </p>
                          {groupItems.map((item) => {
                            const idx = results.indexOf(item);
                            const active = idx === activeIndex;
                            return (
                              <button
                                key={item.id}
                                onClick={() => select(item)}
                                onMouseMove={() => setActiveIndex(idx)}
                                className={cn(
                                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                                  active && "bg-white/[0.06]",
                                )}
                              >
                                <span
                                  className={cn(
                                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1 transition-colors",
                                    active
                                      ? "bg-accent/15 text-accent ring-accent/30"
                                      : "bg-white/[0.04] text-fg-muted ring-line",
                                  )}
                                >
                                  <item.icon className="h-4 w-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[0.86rem] font-medium">
                                    {item.label}
                                  </span>
                                  <span className="block truncate text-[0.74rem] text-fg-subtle">
                                    {item.sub}
                                  </span>
                                </span>
                                {active && (
                                  <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-fg-subtle" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                    <span>↑↓ navigate</span>
                    <span>↵ open</span>
                    <span>esc close</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
