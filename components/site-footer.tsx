import Link from "next/link";
import { Globe, Mail } from "lucide-react";
import { Logo } from "@/components/logo";
import { supportEmail } from "@/lib/site";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how" },
      { label: "Sample paper", href: "/#showcase" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: `mailto:${supportEmail}` },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Quiz demo", href: "/#quiz" },
      { label: "Security", href: "/privacy#security" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Data Processing", href: "/privacy#data-processing" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-line">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-20 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-5">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-fg-muted">
              Enterprise-grade AI for assessment design. QraftPaper turns
              syllabi, past papers and weightages into exam-ready question
              papers.
            </p>
            <div className="flex gap-2">
              {[
                { Icon: Globe, label: "Website", href: "/" },
                {
                  Icon: Mail,
                  label: "Email us",
                  href: `mailto:${supportEmail}`,
                },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="grid h-9 w-9 place-items-center rounded-full glass text-fg-muted transition-colors hover:text-fg"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="flex flex-col gap-3.5">
              <h4 className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-fg-subtle">
                {col.title}
              </h4>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-sm text-fg-muted transition-colors hover:text-fg"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-line pt-8 sm:flex-row">
          <p className="text-xs text-fg-subtle">
            © {new Date().getFullYear()} QraftPaper. All rights reserved.
          </p>
          <p className="text-xs text-fg-subtle">
            Operated by Aniket Kumbhar
          </p>
        </div>
      </div>

      {/* oversized watermark wordmark */}
      <div
        aria-hidden
        className="pointer-events-none select-none text-center text-[18vw] font-semibold leading-[0.8] tracking-tighter text-tint/[0.018]"
      >
        QraftPaper
      </div>
    </footer>
  );
}
