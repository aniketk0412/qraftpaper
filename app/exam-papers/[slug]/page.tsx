import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { GridBackdrop } from "@/components/landing/grid-backdrop";
import { GlowButton } from "@/components/ui/glow-button";
import {
  examPapers,
  getExamPaper,
  relatedExamPapers,
} from "@/lib/exam-papers";
import { siteUrl } from "@/lib/site";

// Pre-render every catalogued paper at build time. Add an entry to
// lib/exam-papers.ts and its page appears here automatically.
export function generateStaticParams() {
  return examPapers.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const paper = getExamPaper(slug);
  if (!paper) return {};

  const title = `${paper.subject} (${paper.code}) — Previous Year Question Paper & Practice Generator`;
  const path = `/exam-papers/${paper.slug}`;
  return {
    title,
    description: paper.blurb,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title,
      description: paper.blurb,
      url: `${siteUrl}${path}`,
    },
    twitter: { card: "summary_large_image", title, description: paper.blurb },
  };
}

export default async function ExamPaperPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const paper = getExamPaper(slug);
  if (!paper) notFound();

  // Static SEO landing page (prerendered via generateStaticParams) — no
  // per-request auth, so the nav/CTAs render signed-out. These pages target
  // logged-out search traffic; static delivery is worth more here than
  // personalising the nav for the rare signed-in visitor.
  const related = relatedExamPapers(slug);
  const path = `/exam-papers/${paper.slug}`;

  // Course schema so these pages are eligible for rich results — an edge over
  // the PYQ-dump sites that ship zero structured data.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        "@id": `${siteUrl}${path}#course`,
        name: `${paper.subject} (${paper.code})`,
        description: paper.blurb,
        url: `${siteUrl}${path}`,
        educationalLevel: paper.level,
        provider: { "@type": "Organization", name: "QraftPaper", url: siteUrl },
        about: paper.units,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Exam papers",
            item: `${siteUrl}/exam-papers`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `${paper.subject} (${paper.code})`,
            item: `${siteUrl}${path}`,
          },
        ],
      },
    ],
  };

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GridBackdrop />
      <SiteNav />

      <main className="mx-auto max-w-4xl px-5 pb-24 pt-32 sm:px-8">
        {/* Breadcrumb */}
        <nav className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-fg-subtle">
          <Link href="/exam-papers" className="transition-colors hover:text-fg">
            Exam papers
          </Link>
          <span className="px-2">/</span>
          <span className="text-fg-muted">{paper.code}</span>
        </nav>

        <header className="mt-6">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-violet-bright">
            {paper.level}
          </p>
          <h1 className="mt-3 text-balance text-[2.3rem] font-semibold leading-[1.08] tracking-[-0.02em] text-fg sm:text-5xl">
            {paper.subject} ({paper.code}) — Previous Year Question Paper
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-[1.02rem] leading-relaxed text-fg-muted">
            {paper.blurb}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <GlowButton href="/signup" size="lg">
              <Sparkles className="h-4 w-4" />
              Generate a {paper.code} mock paper
            </GlowButton>
            <GlowButton href="/#showcase" variant="secondary" size="lg">
              See a sample first
            </GlowButton>
          </div>

          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-6 text-[0.82rem]">
            {[
              ["Exam", paper.exam],
              ["Total marks", `${paper.marks}`],
              ["Duration", `${paper.durationHrs} hours`],
              ["Units", `${paper.units.length}`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                  {k}
                </dt>
                <dd className="mt-0.5 font-medium text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </header>

        {/* Syllabus units */}
        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-fg">
            Syllabus units covered
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {paper.units.map((u) => (
              <span
                key={u}
                className="rounded-lg border border-line bg-tint/[0.03] px-3 py-1.5 text-[0.82rem] text-fg-muted"
              >
                {u}
              </span>
            ))}
          </div>
        </section>

        {/* Sample questions in the real format */}
        <section className="mt-14">
          <h2 className="text-xl font-semibold tracking-tight text-fg">
            Sample questions in the {paper.code} format
          </h2>
          <p className="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-fg-muted">
            These mirror the style and weightage of the real paper. QraftPaper
            generates a full set like this — matched to your uploaded syllabus
            and difficulty mix — every time.
          </p>
          <ol className="mt-6 flex flex-col gap-3">
            {paper.sampleQuestions.map((q, i) => (
              <li
                key={i}
                className="glass flex gap-4 rounded-lg p-5"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-tint/[0.05] font-mono text-[0.72rem] text-violet-bright">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[0.92rem] leading-relaxed text-fg">
                    {q.text}
                  </p>
                  <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-wider text-fg-subtle">
                    {q.unit} · {q.marks} marks
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Conversion block */}
        <section className="mt-16 overflow-hidden rounded-2xl glass-strong p-8 text-center sm:p-12">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            Don&apos;t practise one old paper. Practise ten.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-[0.95rem] leading-relaxed text-fg-muted">
            Upload your {paper.subject} syllabus and last year&apos;s question
            paper. QraftPaper drafts unlimited mocks and timed MCQ quizzes in
            this exact format — print them, time yourself, share with your group.
          </p>
          <div className="mt-7 flex justify-center">
            <GlowButton href="/signup" size="lg">
              Generate your first {paper.code} paper
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
            </GlowButton>
          </div>
        </section>

        {/* Related papers — internal linking for crawl depth + discovery. */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-lg font-semibold tracking-tight text-fg">
              Other papers
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/exam-papers/${r.slug}`}
                  className="group glass flex items-center gap-3 rounded-lg p-4 transition-colors hover:border-line-strong hover:bg-tint/[0.045]"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-tint/[0.05] text-violet-bright">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[0.9rem] font-medium text-fg">
                      {r.subject}
                    </span>
                    <span className="font-mono text-[0.66rem] uppercase tracking-wider text-fg-subtle">
                      {r.code}
                    </span>
                  </span>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
