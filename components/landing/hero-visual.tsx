"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Check, FileCheck2, Gauge, ShieldCheck } from "lucide-react";
import { easeOut } from "@/lib/motion";

const rows = [
  {
    n: "01",
    marks: 2,
    unit: "Unit I",
    lines: [
      "Define an abstract data type and give one",
      "example distinct from a primitive type.",
    ],
  },
  {
    n: "02",
    marks: 10,
    unit: "Unit III",
    lines: [
      "Construct an AVL tree for the keys 30, 20, 40,",
      "10, 25 — show each rebalancing rotation.",
    ],
  },
  {
    n: "03",
    marks: 10,
    unit: "Unit IV",
    lines: [
      "Compare separate chaining and open addressing",
      "as collision-resolution strategies.",
    ],
  },
  {
    n: "04",
    marks: 15,
    unit: "Unit V",
    lines: [
      "Derive the minimum spanning tree using",
      "Kruskal's algorithm and analyse its complexity.",
    ],
  },
];

const stages = [
  "Reading syllabus",
  "Mapping Unit III",
  "Synthesising questions",
  "Balancing difficulty",
  "Finalising paper",
];

// Small flat-plate caption chip used for the two annotations pinned to the
// preview. Editorial: solid panel, hairline rule, no float, no drop shadow.
function FloatChip({
  icon: Icon,
  title,
  meta,
  className,
}: {
  icon: typeof ShieldCheck;
  title: string;
  meta: string;
  className: string;
}) {
  return (
    <div className={`absolute z-20 hidden sm:block ${className}`}>
      <div className="flex items-center gap-2 border border-line-strong bg-panel px-3 py-2">
        <span className="grid h-7 w-7 place-items-center border border-line bg-canvas text-fg">
          <Icon className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="text-[0.72rem] font-medium">{title}</p>
          <p className="font-mono text-[0.6rem] uppercase tracking-wider text-fg-subtle">
            {meta}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setCount((c) => (c >= rows.length ? 0 : c + 1));
    }, 1150);
    return () => clearInterval(id);
  }, [inView]);

  const pct = count === 0 ? 7 : Math.round((count / rows.length) * 100);

  return (
    <div ref={ref} className="relative">
      {/* Static annotation plates — no bobbing. */}
      <FloatChip
        icon={ShieldCheck}
        title="Difficulty balanced"
        meta="Bloom's verified"
        className="-right-3 top-10"
      />
      <FloatChip
        icon={Gauge}
        title="Weightage matched"
        meta="Match report ready"
        className="-left-5 bottom-16"
      />

      {/* The credibility anchor — a generated paper as a framed printing plate:
          a thin ruled border around a paper sheet, no glass, no glow, no soft
          drop shadow. The offset shadow gives it a single crisp lift. */}
      <div className="relative border border-ink bg-panel p-1.5 shadow-[var(--shadow-press)]">
        <div className="bg-canvas p-5">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center bg-accent">
                <FileCheck2 className="h-[18px] w-[18px] text-on-accent" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium">Data Structures & Algorithms</p>
                <p className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                  CS-204 · End-Semester · 70 marks
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 border border-violet/30 bg-violet/10 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-wider text-violet-bright">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-bright" />
              Generating
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2.5">
            {rows.map((row, i) => {
              const state =
                i < count ? "done" : i === count ? "active" : "pending";
              return (
                <motion.div
                  key={row.n}
                  animate={{
                    opacity: state === "pending" ? 0.32 : 1,
                  }}
                  transition={{ duration: 0.4 }}
                  className="flex gap-3 border border-line bg-card-hi p-3"
                >
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center font-mono text-[0.62rem] ${
                      state === "done"
                        ? "bg-violet/20 text-violet-bright"
                        : "bg-canvas text-fg-subtle"
                    }`}
                  >
                    {state === "done" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      row.n
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    {state === "done" ? (
                      <p className="text-[0.78rem] leading-snug text-fg/90">
                        {row.lines.join(" ")}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5 py-0.5">
                        <div
                          className={`h-2 ${
                            state === "active" ? "bg-violet/40" : "bg-line-strong"
                          }`}
                          style={{ width: "92%" }}
                        />
                        <div
                          className={`h-2 ${
                            state === "active" ? "bg-violet/40" : "bg-line-strong"
                          }`}
                          style={{ width: "64%" }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="bg-canvas px-1.5 py-0.5 font-mono text-[0.58rem] text-fg-muted">
                      {row.marks} m
                    </span>
                    <span className="font-mono text-[0.55rem] uppercase tracking-wider text-fg-subtle">
                      {row.unit}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 border-t border-line pt-4">
            <div className="flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-wider">
              <span className="text-fg-muted">
                {stages[Math.min(count, stages.length - 1)]}
              </span>
              <span className="text-violet-bright">{pct}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden bg-line-strong/60">
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: easeOut }}
                className="h-full bg-accent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
