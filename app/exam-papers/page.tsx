import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { GridBackdrop } from "@/components/landing/grid-backdrop";
import { examPapers } from "@/lib/exam-papers";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Previous Year Question Papers & Practice Generators — QraftPaper",
  description:
    "Browse subjects and generate unlimited mock exam papers that match the real previous-year format. Upload your syllabus and last year's paper to get started.",
  alternates: { canonical: "/exam-papers" },
};

// Static SEO landing page — no per-request data, so it prerenders at build
// time for the fastest possible TTFB/crawl. The nav renders signed-out (these
// pages are acquisition surfaces for logged-out search visitors); a logged-in
// visitor simply sees the marketing nav here, which is an acceptable trade for
// static delivery.
export default function ExamPapersIndex() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Exam papers",
    itemListElement: examPapers.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${p.subject} (${p.code})`,
      url: `${siteUrl}/exam-papers/${p.slug}`,
    })),
  };

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GridBackdrop />
      <SiteNav />

      <main className="mx-auto max-w-5xl px-5 pb-24 pt-32 sm:px-8">
        <header className="max-w-2xl">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-violet-bright">
            Exam papers
          </p>
          <h1 className="mt-3 text-balance text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.02em] text-fg sm:text-5xl">
            Previous year question papers, then unlimited mocks
          </h1>
          <p className="mt-5 text-pretty text-[1.02rem] leading-relaxed text-fg-muted">
            Pick your subject to see its real exam format and sample questions —
            then upload your syllabus and last year&apos;s paper to generate
            fresh practice papers that match it.
          </p>
        </header>

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {examPapers.map((p) => (
            <Link
              key={p.slug}
              href={`/exam-papers/${p.slug}`}
              className="group glass flex flex-col rounded-lg p-6 transition-colors hover:border-line-strong hover:bg-tint/[0.045]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-tint/[0.05] text-violet-bright">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-[1.02rem] font-semibold tracking-tight text-fg">
                    {p.subject}
                  </h2>
                  <p className="font-mono text-[0.64rem] uppercase tracking-wider text-fg-subtle">
                    {p.code} · {p.marks} marks · {p.durationHrs}h
                  </p>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-[0.86rem] leading-relaxed text-fg-muted">
                {p.blurb}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-accent">
                View paper & generate
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
