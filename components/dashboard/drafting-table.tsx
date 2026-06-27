"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { GlowButton } from "@/components/ui/glow-button";
import { DeleteButton } from "@/components/ui/delete-button";
import { ExamDatePicker } from "@/components/dashboard/exam-date-picker";
import {
  STARTER_BLUEPRINTS,
  loadCustomBlueprints,
  paperConfigFromBlueprint,
  sectionsTotalMarks,
  type Blueprint,
  type BlueprintSection,
} from "@/lib/blueprints";
import {
  createBlueprintAction,
  deleteBlueprintAction,
  migrateBlueprintsAction,
} from "@/app/dashboard/subjects/blueprint-actions";
import type { DashboardSubject } from "@/lib/subjects";
import { cn } from "@/lib/utils";

const MIGRATED_KEY = "qp-blueprints-migrated";

function masteryClass(pct: number | null): string {
  if (pct === null) return "text-fg-muted";
  if (pct >= 80) return "text-accent";
  if (pct >= 55) return "text-violet-bright";
  return "text-gold";
}

function statusFor(subject: DashboardSubject): {
  label: string;
  urgent: boolean;
  ready: boolean;
} {
  if (subject.daysToExam !== null && subject.daysToExam >= 0) {
    return {
      label:
        subject.daysToExam === 0
          ? "Exam today"
          : `${subject.daysToExam}d to exam`,
      urgent: subject.daysToExam <= 7,
      ready: false,
    };
  }
  return {
    label: subject.hasProfile ? "Ready" : "Needs docs",
    urgent: false,
    ready: subject.hasProfile,
  };
}

export function DraftingTable({
  subjects,
  docCounts,
  customBlueprints,
}: {
  subjects: DashboardSubject[];
  docCounts: Record<string, number>;
  customBlueprints: Blueprint[];
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // One-time backfill: lift any blueprints still sitting in this browser's
  // localStorage into the account's DB. Guarded by a ref (no double-fire in
  // one mount) and a localStorage flag (no re-run on later visits); the server
  // action additionally dedupes by name, so it's safe regardless.
  const migrating = useRef(false);
  useEffect(() => {
    if (migrating.current) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(MIGRATED_KEY) === "1") return;

    const local = loadCustomBlueprints();
    if (local.length === 0) {
      window.localStorage.setItem(MIGRATED_KEY, "1");
      return;
    }
    migrating.current = true;
    const payload = local.map((b) => ({
      name: b.name,
      description: b.description ?? "",
      config: b.config,
    }));
    migrateBlueprintsAction(payload)
      .then((res) => {
        // The server responded — whether it migrated rows or rejected stale/
        // malformed local data, mark it done so we never re-attempt on future
        // visits. Only a thrown network error (below) leaves the flag unset so
        // a genuinely transient failure can retry on the next mount.
        window.localStorage.setItem(MIGRATED_KEY, "1");
        if (res.ok && res.migrated > 0) router.refresh();
      })
      .catch(() => {
        migrating.current = false;
      });
  }, [router]);

  return (
    <div className="border-y border-line">
      {subjects.map((subject, index) => (
        <SubjectRow
          key={subject.id}
          subject={subject}
          index={index}
          docs={docCounts[subject.id] ?? 0}
          expanded={expandedId === subject.id}
          onToggle={() =>
            setExpandedId((id) => (id === subject.id ? null : subject.id))
          }
          customBlueprints={customBlueprints}
        />
      ))}
    </div>
  );
}

function SubjectRow({
  subject,
  index,
  docs,
  expanded,
  onToggle,
  customBlueprints,
}: {
  subject: DashboardSubject;
  index: number;
  docs: number;
  expanded: boolean;
  onToggle: () => void;
  customBlueprints: Blueprint[];
}) {
  const status = statusFor(subject);
  const mastery = subject.masteryPct !== null ? `${subject.masteryPct}%` : "—";

  return (
    <div className="border-b border-line last:border-b-0">
      <div className="group grid grid-cols-[2.25rem_1fr] gap-x-3 px-1 py-5 transition-colors hover:bg-card-hi sm:grid-cols-[2.75rem_1fr_auto] sm:items-center sm:gap-x-5">
        <span className="pt-0.5 font-mono text-[0.7rem] leading-tight text-fg-subtle sm:pt-0">
          [ {String(index + 1).padStart(2, "0")} ]
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-violet-bright">
              {subject.code}
            </p>
            <span
              className={cn(
                "rounded-[2px] border px-2 py-0.5 font-mono text-[0.54rem] uppercase tracking-[0.16em]",
                status.urgent
                  ? "border-gold/40 bg-gold/10 text-gold"
                  : status.ready
                    ? "border-accent/35 bg-accent/10 text-accent"
                    : "border-line-strong bg-card-hi text-fg-muted",
              )}
            >
              {status.label}
            </span>
          </div>
          <Link
            href={`/dashboard/subjects/${subject.id}`}
            className="mt-1 block truncate text-lg font-semibold tracking-tight transition-colors hover:text-violet-bright"
          >
            {subject.name}
          </Link>
          <p className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-fg-subtle">
            {String(docs).padStart(2, "0")} docs ·{" "}
            {String(subject.papers).padStart(2, "0")} papers · mastery{" "}
            <span className={masteryClass(subject.masteryPct)}>{mastery}</span>
          </p>
        </div>

        <div className="col-span-2 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 sm:col-span-1 sm:mt-0 sm:justify-end">
          <ExamDatePicker
            subjectId={subject.id}
            currentValue={subject.examDate}
          />
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="inline-flex h-9 items-center gap-1.5 rounded-[3px] border border-ink bg-panel px-3 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-fg shadow-[var(--shadow-press)] transition-colors hover:bg-card-hi active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            Draft
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-150",
                expanded && "rotate-180",
              )}
            />
          </button>
          <DeleteButton
            endpoint={`/api/subjects/${subject.id}`}
            label="subject"
          />
        </div>
      </div>

      {expanded && (
        <div className="px-1 pb-6">
          <SpecMatrix subject={subject} customBlueprints={customBlueprints} />
        </div>
      )}
    </div>
  );
}

function SpecMatrix({
  subject,
  customBlueprints,
}: {
  subject: DashboardSubject;
  customBlueprints: Blueprint[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  if (!subject.hasProfile) {
    return (
      <div className="border border-line bg-card-hi/40 px-5 py-6">
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-fg-subtle">
          No profile on file
        </p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-fg-muted">
          This subject has no syllabus/PYQ profile yet, so there&apos;s nothing
          to draft against.{" "}
          <Link
            href={`/dashboard/subjects/${subject.id}`}
            className="text-accent underline-offset-2 hover:underline"
          >
            Add documents
          </Link>{" "}
          to unlock its blueprints.
        </p>
      </div>
    );
  }

  const allBlueprints = [...STARTER_BLUEPRINTS, ...customBlueprints];

  async function draft(bp: Blueprint) {
    if (pendingId) return;
    setPendingId(bp.id);
    setStatus(`Drafting "${bp.name}" for ${subject.code}…`);
    try {
      const response = await fetch("/api/generate/paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          config: paperConfigFromBlueprint(bp, subject.name),
        }),
      });
      const body = (await response.json()) as {
        paper?: { id: string };
        error?: string;
      };
      if (!response.ok || !body.paper) {
        setPendingId(null);
        setStatus(body.error ?? "Unable to draft this paper.");
        return;
      }
      router.push(`/papers/${body.paper.id}`);
    } catch {
      setPendingId(null);
      setStatus("Network error — please try again.");
    }
  }

  async function remove(id: string) {
    const res = await deleteBlueprintAction(id);
    if (res.ok) router.refresh();
  }

  return (
    <div className="border border-line bg-canvas">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-fg-subtle">
          Specification matrix · choose a structure to draft
        </p>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-violet-bright transition-colors hover:text-violet"
        >
          {creating ? (
            <>
              <X className="h-3 w-3" /> Close
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" /> Define custom
            </>
          )}
        </button>
      </div>

      {creating && (
        <CreateBlueprintForm
          onCancel={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}

      <div>
        {allBlueprints.map((bp) => (
          <MatrixRow
            key={bp.id}
            bp={bp}
            pending={pendingId === bp.id}
            disabled={pendingId !== null}
            onDraft={() => draft(bp)}
            onDelete={bp.builtIn ? undefined : () => remove(bp.id)}
          />
        ))}
      </div>

      {status && (
        <p className="border-t border-line px-4 py-2.5 text-[0.78rem] text-fg-subtle">
          {status}
        </p>
      )}
    </div>
  );
}

function MatrixRow({
  bp,
  pending,
  disabled,
  onDraft,
  onDelete,
}: {
  bp: Blueprint;
  pending: boolean;
  disabled: boolean;
  onDraft: () => void;
  onDelete?: () => void;
}) {
  const marks = sectionsTotalMarks(bp.config.sections);
  const mix = bp.config.difficultyMix;
  const sectionCount = bp.config.sections.length;

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-3 border-t border-line px-4 py-4 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <h4 className="font-serif text-base font-medium tracking-tight">
            {bp.name}
          </h4>
          <span className="rounded-[2px] border border-line-strong bg-card-hi px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.16em] text-fg-subtle">
            {bp.builtIn ? "Starter" : "Custom"}
          </span>
        </div>
        <p className="mt-2 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-fg-subtle">
          [ DURATION: {bp.config.durationMins} MIN {"//"} STRUCTURE:{" "}
          {sectionCount} SECTION{sectionCount === 1 ? "" : "S"} ]
        </p>
        <p className="mt-1 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-fg-subtle">
          [ EASY {mix.Easy} / MED {mix.Medium} / HARD {mix.Hard} {"//"} {marks}{" "}
          MARKS ]
        </p>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <GlowButton
          type="button"
          variant="ink"
          size="sm"
          onClick={onDraft}
          disabled={disabled}
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Drafting…
            </>
          ) : (
            <>
              Draft
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </GlowButton>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${bp.name}`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[2px] border border-line text-fg-subtle transition-colors hover:border-line-strong hover:text-fg"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

const emptySection: BlueprintSection = {
  title: "",
  instruction: "",
  marksPerQuestion: 2,
  count: 5,
};

const inputCls =
  "w-full rounded-[2px] border border-line bg-canvas px-3 py-2 text-sm text-fg outline-none transition-colors placeholder:text-fg-subtle focus:border-fg";

function CreateBlueprintForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMins, setDurationMins] = useState(180);
  const [mix, setMix] = useState({ Easy: 30, Medium: 50, Hard: 20 });
  const [sections, setSections] = useState<BlueprintSection[]>([
    {
      ...emptySection,
      title: "Section A — Short Answer",
      instruction: "Answer all questions.",
    },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalMarks = sectionsTotalMarks(sections);

  function updateSection(i: number, patch: Partial<BlueprintSection>) {
    setSections((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  }

  async function save() {
    const cleanName = name.trim();
    const validSections = sections
      .map((s) => ({
        title: s.title.trim(),
        instruction: s.instruction.trim(),
        marksPerQuestion: Number(s.marksPerQuestion) || 0,
        count: Number(s.count) || 0,
      }))
      .filter(
        (s) =>
          s.title && s.instruction && s.marksPerQuestion > 0 && s.count > 0,
      );

    if (!cleanName) {
      setError("Give the blueprint a name.");
      return;
    }
    if (validSections.length === 0) {
      setError(
        "Add at least one section with a title, instruction, marks and count.",
      );
      return;
    }

    setSaving(true);
    setError(null);
    const res = await createBlueprintAction({
      name: cleanName,
      description: description.trim(),
      config: {
        examTitle: cleanName,
        totalMarks: sectionsTotalMarks(validSections),
        durationMins: Number(durationMins) || 60,
        sections: validSections,
        difficultyMix: {
          Easy: Number(mix.Easy) || 0,
          Medium: Number(mix.Medium) || 0,
          Hard: Number(mix.Hard) || 0,
        },
      },
    });
    if (res.ok) {
      onSaved();
    } else {
      setSaving(false);
      setError(res.error ?? "Could not save the blueprint.");
    }
  }

  return (
    <div className="border-b border-line bg-card-hi/40 p-4">
      <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-fg-subtle">
        [ REF // New blueprint ]
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-fg-subtle">
            Name
          </span>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Practical Exam"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-fg-subtle">
            Description
          </span>
          <input
            className={inputCls}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short optional summary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-fg-subtle">
            Duration (min)
          </span>
          <input
            type="number"
            min={1}
            className={inputCls}
            value={durationMins}
            onChange={(e) => setDurationMins(Number(e.target.value))}
          />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-fg-subtle">
            Difficulty mix (%)
          </span>
          <div className="flex gap-2">
            {(["Easy", "Medium", "Hard"] as const).map((k) => (
              <input
                key={k}
                type="number"
                min={0}
                max={100}
                aria-label={`${k} percent`}
                className={inputCls}
                value={mix[k]}
                onChange={(e) =>
                  setMix((m) => ({ ...m, [k]: Number(e.target.value) }))
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-fg-subtle">
          Sections
        </span>
        <span className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
          Total {totalMarks} marks
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-2.5">
        {sections.map((s, i) => (
          <div key={i} className="border border-line bg-canvas p-3">
            <div className="flex items-center gap-2">
              <input
                className={inputCls}
                value={s.title}
                onChange={(e) => updateSection(i, { title: e.target.value })}
                placeholder="Section title"
              />
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setSections((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  aria-label="Remove section"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[2px] border border-line text-fg-subtle transition-colors hover:text-fg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <input
              className={cn(inputCls, "mt-2")}
              value={s.instruction}
              onChange={(e) =>
                updateSection(i, { instruction: e.target.value })
              }
              placeholder="Instruction (e.g. Answer all questions.)"
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-fg-subtle">
                Marks/Q
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={s.marksPerQuestion}
                  onChange={(e) =>
                    updateSection(i, {
                      marksPerQuestion: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-fg-subtle">
                Count
                <input
                  type="number"
                  min={1}
                  className={inputCls}
                  value={s.count}
                  onChange={(e) =>
                    updateSection(i, { count: Number(e.target.value) })
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setSections((prev) => [...prev, { ...emptySection }])}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-[2px] border border-dashed border-line-strong py-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-fg-muted transition-colors hover:border-fg hover:text-fg"
      >
        <Plus className="h-3.5 w-3.5" />
        Add section
      </button>

      {error && <p className="mt-3 text-[0.78rem] text-gold">{error}</p>}

      <div className="mt-4 flex gap-2">
        <GlowButton
          type="button"
          variant="ink"
          size="sm"
          onClick={save}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : (
            "Save blueprint"
          )}
        </GlowButton>
        <GlowButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </GlowButton>
      </div>
    </div>
  );
}
