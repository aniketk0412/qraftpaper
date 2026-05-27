import type { ReactNode } from "react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

export function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-32 sm:px-8">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-violet-bright">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-gradient">
          {title}
        </h1>
        {updated && (
          <p className="mt-2 text-[0.82rem] text-fg-subtle">
            Last updated {updated}
          </p>
        )}
        <div className="legal-prose mt-10 flex flex-col gap-8">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{heading}</h2>
      <div className="flex flex-col gap-3 text-[0.92rem] leading-relaxed text-fg-muted">
        {children}
      </div>
    </section>
  );
}
