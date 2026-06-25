"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  Check,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MeterBar } from "@/components/ui/meter-bar";
import { difficultyBarFill, difficultyDarkChip } from "@/lib/difficulty";
import { cn } from "@/lib/utils";
import { type Difficulty, type QuestionPaper } from "@/lib/demo-data";
import { evaluateBlueprintMatch } from "@/lib/blueprint-match";
import type { PaperGenerationConfig } from "@/lib/ai/generate";
import type { PaperQuestion } from "@/lib/types";

export function PaperEditor({
  paper: initial,
  paperId,
  config,
}: {
  paper: QuestionPaper;
  paperId: string;
  config: PaperGenerationConfig | null;
}) {
  const [paper, setPaper] = useState<QuestionPaper>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [regenId, setRegenId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [autosaveState, setAutosaveState] = useState<
    "idle" | "pending" | "saved" | "failed"
  >("idle");
  // Skip the first effect run (initial mount) so we don't post the unchanged
  // server-loaded paper back the moment the editor opens.
  const firstRenderRef = useRef(true);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedSignatureRef = useRef<string>(JSON.stringify(initial));
  // Latest paper kept in a ref so the unmount-flush effect can read the current
  // value without re-subscribing (and re-arming the flush) on every keystroke.
  const paperRef = useRef(paper);
  useEffect(() => {
    paperRef.current = paper;
  }, [paper]);

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

  // Recomputed live as the paper is edited, so the score always reflects the
  // current draft rather than what was generated.
  const blueprint = useMemo(
    () => (config ? evaluateBlueprintMatch(config, paper) : null),
    [config, paper],
  );

  // Debounced autosave: every keystroke / inline edit / delete schedules a
  // PATCH 2 s later. If the paper changes again before the timer fires we
  // reset, so we batch fast-typing into a single save. Signature compare
  // skips no-op saves when state churns without real content change.
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const signature = JSON.stringify(paper);
    if (signature === lastSavedSignatureRef.current) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    setAutosaveState("pending");
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/papers/${paperId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: paper }),
        });
        if (!response.ok) {
          setAutosaveState("failed");
          return;
        }
        lastSavedSignatureRef.current = signature;
        setAutosaveState("saved");
      } catch {
        setAutosaveState("failed");
      }
    }, 2000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [paper, paperId]);

  // Warn the user if they navigate away while a save is still pending.
  useEffect(() => {
    if (autosaveState !== "pending") return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [autosaveState]);

  // Flush a still-pending autosave when the editor unmounts via client-side
  // navigation (a Next.js <Link> to another route). The 2 s debounce timer is
  // cleared on unmount and the beforeunload guard above only fires on a full
  // page close/reload — so without this, a final edit made <2 s before clicking
  // a sidebar link would be silently lost. `keepalive` lets the PATCH outlive
  // the unmount; the signature check skips it when there's nothing unsaved.
  useEffect(() => {
    return () => {
      if (JSON.stringify(paperRef.current) === lastSavedSignatureRef.current) {
        return;
      }
      try {
        void fetch(`/api/papers/${paperId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: paperRef.current }),
          keepalive: true,
        });
      } catch {
        /* best-effort flush — we're unmounting, nothing else to do */
      }
    };
  }, [paperId]);

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

  async function regenerate(id: string) {
    setRegenId(id);
    setStatus("Regenerating...");

    const response = await fetch("/api/generate/question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paperId, questionId: id }),
    });

    if (!response.ok) {
      // Surface the actual reason instead of a generic "failed" — the route
      // returns 402 (over plan limit), 429 (rate limit) and 502 (AI failure)
      // with human-readable error strings, and the user has no other way
      // to find that out.
      let detail: string | undefined;
      try {
        const body = (await response.json()) as { error?: string };
        detail = body.error;
      } catch {
        /* response wasn't JSON */
      }
      setRegenId(null);
      setStatus(
        detail
          ? `Regeneration failed: ${detail}`
          : `Regeneration failed (${response.status})`,
      );
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
          <span className="ml-auto inline-flex items-center gap-1.5 text-[0.62rem]">
            {autosaveState === "pending" && (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
                <span className="text-fg-muted">Saving</span>
              </>
            )}
            {autosaveState === "saved" && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span className="text-fg-muted">Saved</span>
              </>
            )}
            {autosaveState === "failed" && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-tint/40" />
                <span className="text-fg-muted">
                  Save failed — retrying on next edit
                </span>
              </>
            )}
          </span>
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
                        className="group relative overflow-hidden rounded-xl border border-line bg-tint/[0.018] p-4 transition-colors hover:border-line-strong hover:bg-tint/[0.035]"
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
                                    className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[0.74rem] font-medium text-on-accent transition-colors hover:bg-accent-hover"
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
                                <span className="rounded border border-line bg-tint/[0.03] px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-fg-muted">
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
                                <span className="rounded border border-line bg-tint/[0.03] px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-fg-muted">
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

          {blueprint && (
            <GlassCard className="p-5">
              <div className="flex items-baseline justify-between">
                <h4 className="text-sm font-semibold tracking-tight">
                  Blueprint match
                </h4>
                <span
                  className={cn(
                    "font-mono text-sm font-semibold",
                    blueprint.overall >= 85
                      ? "text-violet-bright"
                      : blueprint.overall >= 60
                        ? "text-gold"
                        : "text-fg",
                  )}
                >
                  {blueprint.overall}%
                </span>
              </div>
              <p className="mt-1 text-[0.72rem] leading-snug text-fg-subtle">
                How closely this draft matches the blueprint you requested.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                {blueprint.dimensions.map((d) => (
                  <div key={d.key}>
                    <div className="flex justify-between text-[0.74rem]">
                      <span className="flex items-center gap-1.5 text-fg-muted">
                        {d.ok ? (
                          <Check className="h-3 w-3 text-violet-bright" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-gold" />
                        )}
                        {d.label}
                      </span>
                      <span className="font-mono text-fg-subtle">
                        {d.actual}
                        <span className="text-fg-subtle/60"> / {d.target}</span>
                      </span>
                    </div>
                    <MeterBar
                      pct={d.score}
                      fill={d.ok ? undefined : "bg-gold"}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>

              {blueprint.flags.length > 0 && (
                <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3">
                  {blueprint.flags.map((flag, i) => (
                    <li
                      key={i}
                      className="flex gap-1.5 text-[0.72rem] leading-snug text-fg-muted"
                    >
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-gold" />
                      {flag}
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          )}

          {status && (
            <p className="px-1 text-[0.74rem] text-fg-subtle">{status}</p>
          )}
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
        "grid h-7 w-7 place-items-center rounded-md border border-line bg-tint/[0.03] text-fg-muted transition-colors hover:bg-tint/[0.07]",
        danger ? "hover:text-fg hover:bg-tint/[0.1]" : "hover:text-fg",
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
