import { ArrowRight, FilePlus2, UploadCloud } from "lucide-react";

import { auth } from "@/auth";
import { GlowButton } from "@/components/ui/glow-button";
import { Reveal } from "@/components/ui/reveal";
import { BackLink } from "@/components/dashboard/back-link";
import { DraftingTable } from "@/components/dashboard/drafting-table";
import { getDb } from "@/lib/db";
import { documents, subjects } from "@/lib/db/schema";
import { listUserSubjects } from "@/lib/subjects";
import { listUserBlueprints } from "@/lib/blueprints-db";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";

export default async function SubjectsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [subjectList, documentCounts, customBlueprints] = userId
    ? await Promise.all([
        listUserSubjects(userId),
        getDb()
          .select({
            subjectId: documents.subjectId,
            count: sql<number>`count(${documents.id})::int`,
          })
          .from(documents)
          .innerJoin(subjects, eq(subjects.id, documents.subjectId))
          .where(eq(subjects.userId, userId))
          .groupBy(documents.subjectId),
        listUserBlueprints(userId),
      ])
    : [[], [], []];

  const docCounts: Record<string, number> = Object.fromEntries(
    documentCounts.map((row) => [row.subjectId, row.count]),
  );

  const hasSubjects = subjectList.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink label="Back to workspace" />

      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-fg-subtle">
              The Drafting Table · Index
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Your source material library
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
              Each subject stores its syllabus, sample paper and PYQs once. Open
              a subject to draft a paper from any exam blueprint against it.
            </p>
          </div>
          {/* Top action shows only when the ledger has entries — in the empty
              state the folder canvas below is the single, unduplicated CTA. */}
          {hasSubjects && (
            <GlowButton href="/dashboard/subjects/new" size="md">
              <FilePlus2 className="h-4 w-4" />
              New subject
            </GlowButton>
          )}
        </div>
      </Reveal>

      {hasSubjects ? (
        <Reveal className="mt-9">
          <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-fg-subtle">
            {String(subjectList.length).padStart(2, "0")} entries on file ·
            click a subject to draft
          </p>
          <DraftingTable
            subjects={subjectList}
            docCounts={docCounts}
            customBlueprints={customBlueprints}
          />
        </Reveal>
      ) : (
        <Reveal className="mt-9">
          <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-fg-subtle">
            00 entries on file
          </p>
          {/* Empty ledger — the index sheet with a single blank entry line
              waiting to be filled in. */}
          <div className="border-y border-line">
            <div className="grid grid-cols-[2.75rem_1fr] items-baseline gap-x-5 px-1 py-7">
              <span className="font-mono text-[0.7rem] text-fg-subtle">
                [ 01 ]
              </span>
              <div>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-fg-subtle">
                  Awaiting first entry
                </p>
                <div className="mt-3 border-b border-dashed border-line-strong" />
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-fg-muted">
                  No subjects on file yet. Add your syllabus, sample paper and
                  PYQs to open the first entry in your library.
                </p>
              </div>
            </div>
          </div>

          {/* Add-subject canvas — an open blueprint folder: ruled border, faint
              drafting grid, square index mark, one flat letterpress CTA. */}
          <div className="relative mt-3 overflow-hidden border border-line bg-canvas">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--bg-grid-fine) 1px, transparent 1px)," +
                  "linear-gradient(to bottom, var(--bg-grid-fine) 1px, transparent 1px)",
                backgroundSize: "22px 22px",
                maskImage: "linear-gradient(135deg, #000 0%, transparent 80%)",
                WebkitMaskImage: "linear-gradient(135deg, #000 0%, transparent 80%)",
              }}
            />
            <div className="relative flex flex-col items-start gap-6 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[2px] border border-line-strong bg-card-hi text-violet-bright">
                  <UploadCloud className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Create your first subject
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">
                    Upload reference PDFs once. QraftPaper extracts the text,
                    builds a reusable profile, and uses that profile for every
                    future generation.
                  </p>
                </div>
              </div>
              <GlowButton href="/dashboard/subjects/new" size="md">
                Add subject
                <ArrowRight className="h-4 w-4" />
              </GlowButton>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
