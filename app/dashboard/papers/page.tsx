import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Download, FileText, FilePlus2 } from "lucide-react";
import { and, desc, eq, ilike, sql } from "drizzle-orm";

import { auth } from "@/auth";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
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

  return (
    <div className="mx-auto max-w-6xl">
      <BackLink />
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-violet-bright">
              Question papers
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gradient">
              Generated papers
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-fg-muted">
              Review, edit and export every paper generated from your subject
              profiles.
            </p>
          </div>
          <GlowButton href="/dashboard" size="md">
            <FilePlus2 className="h-4 w-4" />
            Generate paper
          </GlowButton>
        </div>
      </Reveal>

      {/* Search input + subject filter — only rendered when there are
          papers OR an active filter. A brand-new user with zero papers
          shouldn't see dead controls on top of an "create your first
          subject" empty state. */}
      {(total > 0 || q || subjectId) && (
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

      <div className="mt-8 grid gap-3">
        {rows.map((paper, index) => (
          <Reveal key={paper.id} delay={index * 0.04}>
            <GlassCard hover className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <IconTile icon={FileText} />
                  <div className="min-w-0">
                    <p className="font-mono text-[0.64rem] uppercase tracking-wider text-fg-subtle">
                      {paper.content?.subjectCode ?? "Paper"} ·{" "}
                      {paper.content?.totalMarks ?? 0} marks
                    </p>
                    <h2 className="mt-1 truncate text-lg font-semibold tracking-tight">
                      {paper.title}
                    </h2>
                    <p className="mt-1 text-[0.82rem] text-fg-muted">
                      {paper.content?.subject ?? "Generated paper"} · updated{" "}
                      {formatDate(paper.updatedAt ?? paper.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
            </GlassCard>
          </Reveal>
        ))}
      </div>

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

      {rows.length === 0 && (
        <Reveal>
          <GlassCard className="mt-8 p-7 text-center">
            <IconTile icon={FileText} size="lg" className="mx-auto" />
            <h2 className="mt-5 text-xl font-semibold tracking-tight">
              {q
                ? `No papers match “${q}”`
                : page > 1
                  ? "Nothing on this page"
                  : "No generated papers yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-fg-muted">
              {q
                ? "Try a shorter or different keyword — search matches the paper title."
                : page > 1
                  ? "Go back to page 1 to see your most recent papers."
                  : "Create a profiled subject first, then generate papers from the Overview."}
            </p>
            <GlowButton
              href={
                q
                  ? "/dashboard/papers"
                  : page > 1
                    ? "/dashboard/papers"
                    : "/dashboard/subjects/new"
              }
              className="mt-6"
            >
              {q ? "Clear search" : page > 1 ? "Back to page 1" : "Create subject"}{" "}
              <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </GlassCard>
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
        className="inline-flex h-9 cursor-not-allowed items-center gap-1.5 rounded-full glass px-3 text-[0.78rem] text-fg-subtle opacity-50"
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
      className="inline-flex h-9 items-center gap-1.5 rounded-full glass px-3 text-[0.78rem] text-fg-muted transition-colors hover:text-fg"
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
