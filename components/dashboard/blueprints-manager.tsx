"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Layers,
  Loader2,
  Plus,
  Ruler,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { FormError } from "@/components/ui/form-error";

import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { SelectMenu } from "@/components/ui/select-menu";
import {
  type Blueprint,
  type BlueprintSection,
  STARTER_BLUEPRINTS,
  deleteCustomBlueprint,
  loadCustomBlueprints,
  newBlueprintId,
  paperConfigFromBlueprint,
  saveCustomBlueprint,
  sectionsTotalMarks,
} from "@/lib/blueprints";
import type { DashboardSubject } from "@/lib/subjects";
import { cn } from "@/lib/utils";

const emptySection: BlueprintSection = {
  title: "",
  instruction: "",
  marksPerQuestion: 2,
  count: 5,
};

export function BlueprintsManager({
  subjects,
}: {
  subjects: DashboardSubject[];
}) {
  const router = useRouter();
  const readySubjects = subjects.filter((s) => s.hasProfile);

  const [custom, setCustom] = useState<Blueprint[]>([]);
  const [creating, setCreating] = useState(false);
  const [usingId, setUsingId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState(readySubjects[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    // Custom blueprints live in the browser, so load them after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustom(loadCustomBlueprints());
  }, []);

  const all = [...STARTER_BLUEPRINTS, ...custom];

  function handleDelete(id: string) {
    setCustom(deleteCustomBlueprint(id));
    if (usingId === id) setUsingId(null);
  }

  async function generate(blueprint: Blueprint) {
    if (!subjectId || pending) return;
    setPending(true);
    setStatus(`Generating "${blueprint.name}"...`);
    const subject = readySubjects.find((s) => s.id === subjectId);

    const response = await fetch("/api/generate/paper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectId,
        config: paperConfigFromBlueprint(blueprint, subject?.name ?? ""),
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      paper?: { id: string };
      error?: string;
    };

    if (!response.ok || !body.paper) {
      setPending(false);
      setStatus(body.error ?? "Unable to generate paper");
      return;
    }

    router.push(`/papers/${body.paper.id}`);
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-fg-muted">
          {custom.length > 0
            ? `${custom.length} custom · ${STARTER_BLUEPRINTS.length} starter blueprints`
            : `${STARTER_BLUEPRINTS.length} starter blueprints`}
        </p>
        <GlowButton
          type="button"
          size="sm"
          variant={creating ? "secondary" : "primary"}
          onClick={() => setCreating((v) => !v)}
        >
          {creating ? (
            <>
              <X className="h-3.5 w-3.5" />
              Close
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              New blueprint
            </>
          )}
        </GlowButton>
      </div>

      {creating && (
        <CreateBlueprintForm
          onCancel={() => setCreating(false)}
          onSave={(bp) => {
            setCustom(saveCustomBlueprint(bp));
            setCreating(false);
          }}
        />
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {all.map((bp) => {
          const marks = sectionsTotalMarks(bp.config.sections);
          const isUsing = usingId === bp.id;
          const mix = bp.config.difficultyMix;
          return (
            <GlassCard key={bp.id} className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <IconTile icon={Ruler} />
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-line bg-tint/[0.03] px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-fg-muted">
                    {marks} marks
                  </span>
                  {!bp.builtIn && (
                    <button
                      type="button"
                      onClick={() => handleDelete(bp.id)}
                      aria-label={`Delete ${bp.name}`}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-line text-fg-subtle transition-colors hover:border-line-strong hover:text-fg"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h2 className="mt-5 flex items-center gap-2 text-lg font-semibold tracking-tight">
                {bp.name}
                {!bp.builtIn && (
                  <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[0.54rem] uppercase tracking-wider text-accent">
                    Custom
                  </span>
                )}
              </h2>
              <p className="mt-1 text-[0.84rem] text-fg-muted">
                {bp.description || "Custom exam blueprint."}
              </p>

              <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 text-[0.8rem] text-fg-muted">
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-fg-subtle" />
                  {bp.config.durationMins} min
                </span>
                <span className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-fg-subtle" />
                  {bp.config.sections.length} section
                  {bp.config.sections.length === 1 ? "" : "s"}
                </span>
              </div>

              <p className="mt-3 rounded-lg border border-line bg-tint/[0.02] px-2.5 py-1.5 font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                Easy {mix.Easy}% · Medium {mix.Medium}% · Hard {mix.Hard}%
              </p>

              <div className="mt-5">
                {readySubjects.length === 0 ? (
                  <Link
                    href="/dashboard/subjects/new"
                    className="flex w-full items-center justify-center gap-1.5 rounded-full border border-line py-2 text-[0.8rem] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                  >
                    Add a profiled subject to use
                  </Link>
                ) : isUsing ? (
                  <div className="flex flex-col gap-2">
                    <SelectMenu
                      ariaLabel="Subject"
                      value={subjectId}
                      onChange={setSubjectId}
                      placeholder="Choose a subject"
                      options={readySubjects.map((s) => ({
                        value: s.id,
                        label: `${s.code} — ${s.name}`,
                      }))}
                    />
                    <GlowButton
                      type="button"
                      size="sm"
                      className="w-full"
                      disabled={!subjectId || pending}
                      onClick={() => generate(bp)}
                    >
                      {pending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          Generate paper
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </GlowButton>
                  </div>
                ) : (
                  <GlowButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setUsingId(bp.id);
                      setStatus(null);
                    }}
                  >
                    Use blueprint
                    <ArrowRight className="h-3.5 w-3.5" />
                  </GlowButton>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {status && (
        <p className="mt-4 text-[0.8rem] text-fg-subtle">{status}</p>
      )}
    </div>
  );
}

function CreateBlueprintForm({
  onSave,
  onCancel,
}: {
  onSave: (bp: Blueprint) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMins, setDurationMins] = useState(180);
  const [mix, setMix] = useState({ Easy: 30, Medium: 50, Hard: 20 });
  const [sections, setSections] = useState<BlueprintSection[]>([
    { ...emptySection, title: "Section A — Short Answer", instruction: "Answer all questions." },
  ]);
  const [error, setError] = useState<string | null>(null);

  const totalMarks = sectionsTotalMarks(sections);

  function updateSection(i: number, patch: Partial<BlueprintSection>) {
    setSections((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    );
  }

  function save() {
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

    onSave({
      id: newBlueprintId(),
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
  }

  const inputCls =
    "h-10 w-full rounded-lg border border-line bg-tint/[0.02] px-3 text-sm text-fg placeholder:text-fg-subtle transition-colors focus:border-violet/50 focus:outline-none focus:ring-2 focus:ring-violet/20";

  return (
    <GlassCard className="mt-4 p-5">
      <h2 className="text-sm font-semibold tracking-tight">New blueprint</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.72rem] font-medium text-fg-muted">Name</span>
          <input
            className={inputCls}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Practical Exam"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.72rem] font-medium text-fg-muted">
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
          <span className="text-[0.72rem] font-medium text-fg-muted">
            Duration (minutes)
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
          <span className="text-[0.72rem] font-medium text-fg-muted">
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
        <span className="text-[0.72rem] font-medium text-fg-muted">
          Sections
        </span>
        <span className="font-mono text-[0.66rem] uppercase tracking-wider text-fg-subtle">
          Total {totalMarks} marks
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-2.5">
        {sections.map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-line bg-tint/[0.015] p-3"
          >
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
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-fg-subtle transition-colors hover:text-fg"
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
              <label className="flex items-center gap-2 text-[0.72rem] text-fg-muted">
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
              <label className="flex items-center gap-2 text-[0.72rem] text-fg-muted">
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
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-[0.78rem] text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
      >
        <Plus className="h-3.5 w-3.5" />
        Add section
      </button>

      {error && <FormError className="mt-3">{error}</FormError>}

      <div className="mt-4 flex gap-2">
        <GlowButton type="button" size="sm" onClick={save}>
          Save blueprint
        </GlowButton>
        <GlowButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </GlowButton>
      </div>
    </GlassCard>
  );
}
