"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MeterBar } from "@/components/ui/meter-bar";
import { difficultyBarFill, difficultyDarkChip } from "@/lib/difficulty";
import { cn } from "@/lib/utils";
import {
  type Difficulty,
  type QuestionPaper,
  exampleWeightage,
  maxUnitWeight,
} from "@/lib/demo-data";
import type { PaperQuestion } from "@/lib/types";

export function PaperEditor({
  paper: initial,
  paperId,
}: {
  paper: QuestionPaper;
  paperId: string;
}) {
  const [paper, setPaper] = useState<QuestionPaper>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [regenId, setRegenId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const allQuestions = useMemo(
    () => paper.sections.flatMap((s) => s.questions),
    [paper],
  );
  const totalMarks = allQuestions.reduce((sum, q) => sum + q.marks, 0);
  const diffCounts = useMemo(() => {
    const c = { Easy: 0, Medium: 0, Hard: 0 } as Record<Difficulty, number>;
    allQuestions.forEach((q) => (c[q.difficulty] += 1));
    return c;
  }, [allQuestions]);

  function saveEdit(id: string) {
    setPaper((p) => ({
      ...p,
      sections: p.sections.map((s) => ({
        ...s,
        questions: s.questions.map((q) =>
          q.id === id ? { ...q, text: draft.trim() || q.text } : q,
        ),
      })),
    }));
    setEditingId(null);
  }

  function removeQuestion(id: string) {
    setPaper((p) => ({
      ...p,
      sections: p.sections.map((s) => ({
        ...s,
        questions: s.questions.filter((q) => q.id !== id),
      })),
    }));
  }

  async function savePaper() {
    setStatus("Saving...");
    const response = await fetch(`/api/papers/${paperId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: paper }),
    });

    if (!response.ok) {
      setStatus("Save failed");
      return;
    }

    setStatus("Saved");
  }

  async function regenerate(id: string) {
    setRegenId(id);
    setStatus("Regenerating...");

    const response = await fetch("/api/generate/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId, questionId: id }),
    });

    if (!response.ok) {
      setRegenId(null);
      setStatus("Regeneration failed");
      return;
    }

    const body = (await response.json()) as { question: PaperQuestion };
    setPaper((current) => replaceQuestion(current, body.question));
    setRegenId(null);
    setStatus("Regenerated");
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl glass px-4 py-3 font-mono text-[0.66rem] uppercase tracking-wider text-fg-muted">
          <span className="text-fg">{paper.examTitle}</span>
          <span className="text-fg-subtle">·</span>
          <span>{paper.subjectCode}</span>
          <span className="text-fg-subtle">·</span>
          <span>{paper.durationMins / 60} hours</span>
          <span className="text-fg-subtle">·</span>
          <span className="text-violet-bright">{totalMarks} marks</span>
        </div>

        <div className="flex flex-col gap-6">
          {paper.sections.map((section) => (
            <div key={section.id}>
              <div className="flex items-baseline justify-between border-b border-line pb-2">
                <h3 className="text-sm font-semibold tracking-tight">
                  {section.title}
                </h3>
                <span className="font-mono text-[0.64rem] uppercase tracking-wider text-fg-subtle">
                  {section.questions.length} questions
                </span>
              </div>
              <p className="mt-1 text-[0.78rem] italic text-fg-subtle">
                {section.instruction}
              </p>

              <div className="mt-3 flex flex-col gap-2.5">
                <AnimatePresence initial={false}>
                  {section.questions.map((q) => {
                    const isEditing = editingId === q.id;
                    const isRegen = regenId === q.id;
                    return (
                      <motion.div
                        key={q.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.25 }}
                        className="group relative overflow-hidden rounded-xl border border-line bg-white/[0.018] p-4 transition-colors hover:border-line-strong hover:bg-white/[0.035]"
                      >
                        {isRegen && (
                          <span className="absolute inset-0 z-10 animate-shimmer bg-gradient-to-r from-transparent via-violet/10 to-transparent" />
                        )}
                        <div className="flex gap-3.5">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet/15 font-mono text-[0.7rem] font-medium text-violet-bright">
                            {q.number}
                          </span>

                          <div className="min-w-0 flex-1">
                            {isEditing ? (
                              <div>
                                <textarea
                                  value={draft}
                                  onChange={(e) => setDraft(e.target.value)}
                                  rows={3}
                                  className="w-full resize-none rounded-lg border border-violet/40 bg-canvas/60 p-2.5 text-[0.86rem] leading-relaxed text-fg focus:outline-none focus:ring-2 focus:ring-violet/25"
                                  autoFocus
                                />
                                <div className="mt-2 flex gap-2">
                                  <button
                                    onClick={() => saveEdit(q.id)}
                                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[0.74rem] font-medium text-ink transition-colors hover:bg-[#e7e7e8]"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[0.74rem] text-fg-muted transition-colors hover:text-fg"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[0.86rem] leading-relaxed text-fg/90">
                                {q.text}
                              </p>
                            )}

                            {!isEditing && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                <span className="rounded border border-line bg-white/[0.03] px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-fg-muted">
                                  {q.unit}
                                </span>
                                <span
                                  className={cn(
                                    "rounded border px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider",
                                    difficultyDarkChip[q.difficulty],
                                  )}
                                >
                                  {q.difficulty}
                                </span>
                                <span className="rounded border border-line bg-white/[0.03] px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-fg-muted">
                                  {q.bloom}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className="font-mono text-[0.78rem] font-semibold text-fg">
                              {q.marks}m
                            </span>
                            {!isEditing && (
                              <div className="flex gap-1 opacity-100 transition-opacity duration-200 lg:opacity-0 lg:group-hover:opacity-100">
                                <IconBtn
                                  label="Edit"
                                  onClick={() => {
                                    setEditingId(q.id);
                                    setDraft(q.text);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </IconBtn>
                                <IconBtn
                                  label="Regenerate"
                                  onClick={() => regenerate(q.id)}
                                >
                                  <RefreshCw
                                    className={cn(
                                      "h-3.5 w-3.5",
                                      isRegen && "animate-spin",
                                    )}
                                  />
                                </IconBtn>
                                <IconBtn
                                  label="Delete"
                                  onClick={() => removeQuestion(q.id)}
                                  danger
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </IconBtn>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-col gap-3">
          <GlassCard className="p-5">
            <h4 className="text-sm font-semibold tracking-tight">
              Paper summary
            </h4>
            <dl className="mt-4 flex flex-col gap-2.5 text-[0.82rem]">
              <Row label="Questions" value={String(allQuestions.length)} />
              <Row
                label="Total marks"
                value={`${totalMarks} / ${initial.totalMarks}`}
                accent={totalMarks !== initial.totalMarks}
              />
              <Row label="Duration" value={`${paper.durationMins / 60} hours`} />
              <Row label="Sections" value={String(paper.sections.length)} />
            </dl>
          </GlassCard>

          <GlassCard className="p-5">
            <h4 className="text-sm font-semibold tracking-tight">
              Difficulty mix
            </h4>
            <div className="mt-4 flex flex-col gap-3">
              {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => {
                const count = diffCounts[d];
                const pct = allQuestions.length
                  ? (count / allQuestions.length) * 100
                  : 0;
                return (
                  <div key={d}>
                    <div className="flex justify-between text-[0.76rem]">
                      <span className="text-fg-muted">{d}</span>
                      <span className="font-mono text-fg-subtle">{count}</span>
                    </div>
                    <MeterBar
                      pct={pct}
                      fill={difficultyBarFill[d]}
                      className="mt-1"
                    />
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h4 className="text-sm font-semibold tracking-tight">
              Blueprint match
            </h4>
            <div className="mt-4 flex flex-col gap-2.5">
              {exampleWeightage.map((u) => (
                <div key={u.unit}>
                  <div className="flex justify-between text-[0.74rem]">
                    <span className="font-mono text-fg-subtle">{u.unit}</span>
                    <span className="text-fg-muted">{u.weight}%</span>
                  </div>
                  <MeterBar
                    pct={(u.weight / maxUnitWeight) * 100}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="flex flex-col gap-2">
            <button
              onClick={savePaper}
              className="flex items-center gap-2.5 rounded-xl glass px-4 py-3 text-[0.82rem] text-fg-muted transition-colors hover:text-fg"
            >
              <Check className="h-4 w-4 text-violet-bright" />
              Save paper
            </button>
            <button className="flex items-center gap-2.5 rounded-xl glass px-4 py-3 text-[0.82rem] text-fg-muted transition-colors hover:text-fg">
              <Sparkles className="h-4 w-4 text-violet-bright" />
              Balance difficulty with AI
            </button>
            <button className="flex items-center gap-2.5 rounded-xl glass px-4 py-3 text-[0.82rem] text-fg-muted transition-colors hover:text-fg">
              <ShieldCheck className="h-4 w-4 text-fg-muted" />
              Run originality check
            </button>
            {status && (
              <p className="px-1 text-[0.74rem] text-fg-subtle">{status}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function replaceQuestion(paper: QuestionPaper, nextQuestion: PaperQuestion) {
  return {
    ...paper,
    sections: paper.sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) =>
        question.id === nextQuestion.id ? nextQuestion : question,
      ),
    })),
  };
}

function IconBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md border border-line bg-white/[0.03] text-fg-muted transition-colors hover:bg-white/[0.07]",
        danger ? "hover:text-fg hover:bg-white/[0.1]" : "hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-fg-muted">{label}</dt>
      <dd
        className={cn(
          "font-mono",
          accent ? "text-gold" : "text-fg",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
