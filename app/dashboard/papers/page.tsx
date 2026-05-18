import { ArrowRight, Download, FileText, FilePlus2 } from "lucide-react";
import { desc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowButton } from "@/components/ui/glow-button";
import { IconTile } from "@/components/ui/icon-tile";
import { Reveal } from "@/components/ui/reveal";
import { BackLink } from "@/components/dashboard/back-link";
import { getDb } from "@/lib/db";
import { papers } from "@/lib/db/schema";

export const runtime = "nodejs";

export default async function PapersPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const rows = userId
    ? await getDb()
        .select({
          id: papers.id,
          title: papers.title,
          content: papers.content,
          createdAt: papers.createdAt,
          updatedAt: papers.updatedAt,
        })
        .from(papers)
        .where(eq(papers.userId, userId))
        .orderBy(desc(papers.createdAt))
    : [];

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
                <div className="flex flex-wrap gap-2">
                  <GlowButton
                    href={`/api/export/paper/${paper.id}/pdf`}
                    variant="secondary"
                    size="sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </GlowButton>
                  <GlowButton
                    href={`/papers/${paper.id}`}
                    size="sm"
                  >
                    Open editor <ArrowRight className="h-3.5 w-3.5" />
                  </GlowButton>
                </div>
              </div>
            </GlassCard>
          </Reveal>
        ))}
      </div>

      {rows.length === 0 && (
        <Reveal>
          <GlassCard className="mt-8 p-7 text-center">
            <IconTile icon={FileText} size="lg" className="mx-auto" />
            <h2 className="mt-5 text-xl font-semibold tracking-tight">
              No generated papers yet
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-fg-muted">
              Create a profiled subject first, then generate papers from the
              Overview workspace.
            </p>
            <GlowButton href="/dashboard/subjects/new" className="mt-6">
              Create subject <ArrowRight className="h-4 w-4" />
            </GlowButton>
          </GlassCard>
        </Reveal>
      )}
    </div>
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
