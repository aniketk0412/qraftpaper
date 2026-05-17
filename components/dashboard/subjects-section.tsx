"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { IconTile } from "@/components/ui/icon-tile";
import { easeOut } from "@/lib/motion";
import { demoSubjects } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type Sort = "recent" | "papers" | "name";

const sorts: { key: Sort; label: string }[] = [
  { key: "recent", label: "Recent" },
  { key: "papers", label: "Most papers" },
  { key: "name", label: "A–Z" },
];

export function SubjectsSection() {
  const [sort, setSort] = useState<Sort>("recent");

  const subjects = useMemo(() => {
    const list = [...demoSubjects];
    if (sort === "papers") list.sort((a, b) => b.papers - a.papers);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [sort]);

  return (
    <div className="mt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Your subjects</h2>
        <div className="flex items-center gap-1 self-start rounded-full glass p-1">
          {sorts.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[0.76rem] transition-colors",
                sort === s.key
                  ? "bg-white/[0.08] text-fg"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {subjects.map((subject) => (
          <motion.div
            key={subject.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: easeOut }}
          >
            <Link href="/papers/demo" className="block h-full">
              <GlassCard hover className="h-full p-5">
                <div className="flex items-start justify-between">
                  <IconTile icon={BookOpen} tone={subject.accent} />
                  <ArrowUpRight className="h-4 w-4 text-fg-subtle" />
                </div>
                <p className="mt-4 font-mono text-[0.64rem] uppercase tracking-wider text-fg-subtle">
                  {subject.code}
                </p>
                <h3 className="mt-1 text-[0.95rem] font-medium leading-snug tracking-tight">
                  {subject.name}
                </h3>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[0.72rem] text-fg-muted">
                  <span>{subject.papers} papers</span>
                  <span className="text-fg-subtle">
                    {subject.lastGenerated}
                  </span>
                </div>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
