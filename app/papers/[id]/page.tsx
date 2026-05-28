import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, FileText, Save } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { PaperEditor } from "@/components/paper-editor";
import { GlowButton } from "@/components/ui/glow-button";
import { getDb } from "@/lib/db";
import { papers } from "@/lib/db/schema";
import { normalizePaperConfig } from "@/lib/generation-config";
import { isUuid } from "@/lib/ids";
import type { PaperGenerationConfig } from "@/lib/ai/generate";

export const metadata: Metadata = {
  title: "Paper editor — QraftPaper",
};

export const runtime = "nodejs";

export default async function PaperEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    notFound();
  }

  if (!isUuid(id)) {
    notFound();
  }

  const [paperRecord] = await getDb()
    .select()
    .from(papers)
    .where(and(eq(papers.id, id), eq(papers.userId, session.user.id)))
    .limit(1);

  if (!paperRecord?.content) {
    notFound();
  }

  const paper = paperRecord.content;
  // config is untyped jsonb; normalize it so the editor can show a real
  // blueprint-match report (null when the paper predates config capture).
  const config = normalizePaperConfig(
    paperRecord.config as Partial<PaperGenerationConfig> | undefined,
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3.5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full glass text-fg-muted transition-colors hover:text-fg"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="h-8 w-px bg-line" />
            <div className="leading-tight">
              <p className="text-sm font-medium">{paper.subject}</p>
              <p className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                {paper.subjectCode} · Draft · Saved
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <GlowButton
              href={`/api/export/paper/${paper.id}/docx`}
              variant="secondary"
              size="sm"
            >
              <FileText className="h-3.5 w-3.5" />
              Export Word
            </GlowButton>
            <GlowButton
              href={`/api/export/paper/${paper.id}/pdf`}
              variant="secondary"
              size="sm"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </GlowButton>
            <GlowButton href="/dashboard" size="sm">
              <Save className="h-3.5 w-3.5" />
              Save paper
            </GlowButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <PaperEditor paper={paper} paperId={paper.id} config={config} />
      </main>
    </div>
  );
}
