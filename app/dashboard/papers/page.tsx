import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Download,
  FilePlus2,
} from "lucide-react";
import { and, desc, eq, ilike, sql } from "drizzle-orm";

import { auth } from "@/auth";
import { GlowButton } from "@/components/ui/glow-button";
import { Reveal } from "@/components/ui/reveal";
import { DeleteButton } from "@/components/ui/delete-button";
import { BackLink } from "@/components/dashboard/back-link";
import { SearchInput } from "@/components/dashboard/search-input";
import { SubjectFilter } from "@/components/dashboard/subject-filter";
import { getDb } from "@/lib/db";
import { papers } from "@/lib/db/schema";
import { isUuid } from "@/lib/ids";
import { listUserSubjects } from "@/lib/subjects";

export const runtime = "nodejs";

const PAGE_SIZE = 20;

export default async function PapersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
    subject?: string | string[];
  }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  // Parse ?page=N, clamp to >=1. Anything malformed falls back to page 1.
  const {
    page: pageParam,
    q: qParam,
    subject: subjectParam,
  } = await searchParams;
  const rawPage = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  // Keyword search: case-insensitive substring match on the paper title.
  // Capped at 80 chars so a runaway URL can't make Postgres burn cycles
  // matching a 10k-char ILIKE pattern.
  const rawQ = Array.isArray(qParam) ? qParam[0] : qParam;
  const q = (rawQ ?? "").trim().slice(0, 80);
  // ilike() expects the user-controlled value as a parameter — drizzle binds
  // it, so the % wildcards we add can't be interpreted as SQL. Still, we
  // sanitise the literal % and _ wildcards inside the term so a user typing
  // "100%" doesn't accidentally match every paper.
  const safeQ = q.replace(/[%_]/g, "\\$&");
  // Subject filter: only honour valid UUIDs, otherwise an attacker could
  // inject anything into the where clause via the URL. Drizzle would still
  // bind it, but it's cleaner to reject obviously-malformed input.
  const rawSubject = Array.isArray(subjectParam)
    ? subjectParam[0]
    : subjectParam;
  const subjectId = rawSubject && isUuid(rawSubject) ? rawSubject : null;

  const filters = userId
    ? [
        eq(papers.userId, userId),
        ...(q ? [ilike(papers.title, `%${safeQ}%`)] : []),
        ...(subjectId ? [eq(papers.subjectId, subjectId)] : []),
      ]
    : [];
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  // Get the page rows, the total count and the subject options in parallel.
  // The subject list comes from listUserSubjects (already cached server-side
  // per user) so the extra fetch is effectively free.
  const [rows, paperCountRow, subjects] = userId && whereClause
    ? await Promise.all([
        getDb()
          .select({
            id: papers.id,
            title: papers.title,
            content: papers.content,
            createdAt: papers.createdAt,
            updatedAt: papers.updatedAt,
          })
          .from(papers)
          .where(whereClause)
          .orderBy(desc(papers.createdAt))
          .limit(PAGE_SIZE)
          .offset(offset),
        getDb()
          .select({ count: sql<number>`count(*)::int` })
          .from(papers)
          .where(whereClause)
          .then((r) => r[0] ?? { count: 0 }),
        listUserSubjects(userId),
      ])
    : [[], { count: 0 }, []];
  const total = paperCountRow.count;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = total === 0 ? 0 : offset + 1;
  const showingTo = Math.min(offset + rows.length, total);

  const isFiltered = Boolean(q || subjectId);
  const trulyEmpty = rows.length === 0 && !isFiltered && page === 1;

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink label="Back to workspace" />

      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.66rem] uppercase tracking-[0.24em] text-fg-subtle">
              Examination registry · Index
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Generated papers
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-muted">
              Review, edit and export every paper generated from your subject
              profiles.
            </p>
          </div>
          {/* Top action shows only when the registry has entries — in the empty
              state the registry's own CTA is the single, unduplicated trigger. */}
          {total > 0 && (
            <GlowButton href="/dashboard" size="md">
              <FilePlus2 className="h-4 w-4" />
              Generate paper
            </GlowButton>
          )}
        </div>
      </Reveal>

      {/* Search + subject filter — only when there are papers OR an active
          filter, so a brand-new user never sees dead controls. */}
      {(total > 0 || isFiltered) && (
        <div className="mt-7 flex flex-col gap-3">
          <SearchInput
            placeholder="Search papers by title..."
            className="max-w-md"
          />
          {subjects.length > 1 && (
            <SubjectFilter
              options={subjects.map((s) => ({ id: s.id, code: s.code }))}
            />
          )}
        </div>
      )}

      {rows.length > 0 && (
        <Reveal className="mt-8">
          <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-fg-subtle">
            {String(total).padStart(2, "0")} entries on file
          </p>
          {/* Registry index — a 1-column ledger framed top and bottom, ruled by
              hairlines. Each entry carries its registry number and subject ref. */}
          <div className="border-y border-line">
            {rows.map((paper, index) => {
              const ref = paper.content?.subjectCode ?? "—";
              const marks = paper.content?.totalMarks ?? 0;
              return (
                <div
                  key={paper.id}
                  className="group grid grid-cols-1 gap-y-3 border-b border-line px-1 py-5 transition-colors last:border-b-0 hover:bg-card-hi lg:grid-cols-[1fr_auto] lg:items-center lg:gap-x-6"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-fg-subtle">
                      No. {String(offset + index + 1).padStart(2, "0")} {"//"}{" "}
                      Ref: <span className="text-violet-bright">{ref}</span>
                    </p>
                    <h2 className="mt-1 truncate text-lg font-semibold tracking-tight">
                      {paper.title}
                    </h2>
                    <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-fg-subtle">
                      {marks} marks · {paper.content?.subject ?? "Generated paper"}{" "}
                      · updated {formatDate(paper.updatedAt ?? paper.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <GlowButton
                      href={`/api/export/paper/${paper.id}/pdf`}
                      variant="secondary"
                      size="sm"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </GlowButton>
                    <GlowButton href={`/papers/${paper.id}`} size="sm">
                      Open editor <ArrowRight className="h-3.5 w-3.5" />
                    </GlowButton>
                    <DeleteButton
                      endpoint={`/api/papers/${paper.id}`}
                      label="paper"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      )}

      {rows.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-fg-subtle">
            Showing {showingFrom}–{showingTo} of {total}
          </p>
          <div className="flex items-center gap-2">
            <PageLink
              page={page - 1}
              disabled={page <= 1}
              label="Previous"
              icon="left"
              q={q}
              subjectId={subjectId}
            />
            <span className="font-mono text-[0.72rem] tabular-nums text-fg-muted">
              Page {page} / {totalPages}
            </span>
            <PageLink
              page={page + 1}
              disabled={page >= totalPages}
              label="Next"
              icon="right"
              q={q}
              subjectId={subjectId}
            />
          </div>
        </div>
      )}

      {/* Truly-empty registry: an official examination ledger sheet with a
          title block and pre-printed, unassigned entry lines. No floating card,
          no circular icon — the blueprint itself carries the empty message. */}
      {trulyEmpty && (
        <Reveal className="mt-8">
          <p className="mb-2 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-fg-subtle">
            00 entries on file
          </p>
          <div className="border-y border-line">
            <div className="flex flex-col gap-5 border-b border-line px-1 py-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-violet-bright">
                  Awaiting first entry
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  No generated papers yet
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-muted">
                  Create a profiled subject, then generate your first paper from
                  the Overview — it will be logged here as entry No. 01.
                </p>
              </div>
              <GlowButton href="/dashboard/subjects/new" size="md">
                Create subject
                <ArrowRight className="h-4 w-4" />
              </GlowButton>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[8.5rem_1fr] items-center gap-x-4 border-b border-line px-1 py-4 last:border-b-0"
              >
                <span className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-fg-subtle">
                  No. {String(i + 1).padStart(2, "0")} {"//"} Ref: Unassigned
                </span>
                <span className="border-b border-dashed border-line-strong/60" />
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* Filtered / paged-past-the-end empty: a quiet ledger note, not the full
          registry, since the user already has papers. */}
      {rows.length === 0 && !trulyEmpty && (
        <Reveal className="mt-8">
          <div className="border-y border-line px-1 py-10 text-center">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-fg-subtle">
              No matching entries
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              {q
                ? `No papers match “${q}”`
                : "Nothing on this page"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
              {q
                ? "Try a shorter or different keyword — search matches the paper title."
                : "Go back to page 1 to see your most recent papers."}
            </p>
            <div className="mt-6">
              <GlowButton href="/dashboard/papers" size="md">
                {q ? "Clear search" : "Back to page 1"}
                <ArrowRight className="h-4 w-4" />
              </GlowButton>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}

function PageLink({
  page,
  disabled,
  label,
  icon,
  q,
  subjectId,
}: {
  page: number;
  disabled: boolean;
  label: string;
  icon: "left" | "right";
  q?: string;
  subjectId?: string | null;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-[2px] border border-line bg-card-hi px-3 font-mono text-[0.68rem] uppercase tracking-wider text-fg-subtle opacity-50"
      >
        {icon === "left" && <ChevronLeft className="h-3.5 w-3.5" />}
        {label}
        {icon === "right" && <ChevronRight className="h-3.5 w-3.5" />}
      </span>
    );
  }
  // Preserve search term + subject filter across page navigation so a
  // filtered list stays filtered when the user hits Next/Previous.
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (q) params.set("q", q);
  if (subjectId) params.set("subject", subjectId);
  const href = `/dashboard/papers?${params.toString()}`;
  return (
    <Link
      href={href}
      className="inline-flex h-9 items-center gap-1.5 rounded-[2px] border border-line bg-canvas px-3 font-mono text-[0.68rem] uppercase tracking-wider text-fg-muted transition-colors hover:border-line-strong hover:bg-card-hi hover:text-fg"
    >
      {icon === "left" && <ChevronLeft className="h-3.5 w-3.5" />}
      {label}
      {icon === "right" && <ChevronRight className="h-3.5 w-3.5" />}
    </Link>
  );
}

function formatDate(date: Date | null) {
  if (!date) return "just now";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
