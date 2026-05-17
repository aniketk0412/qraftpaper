import Link from "next/link";
import { Globe, Mail, MessageSquare } from "lucide-react";
import { Logo } from "@/components/logo";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how" },
      { label: "Showcase", href: "#showcase" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Customers", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Security", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Data Processing", href: "#" },
      { label: "Compliance", href: "#" },
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
                { Icon: Globe, label: "Website" },
                { Icon: Mail, label: "Email us" },
                { Icon: MessageSquare, label: "Community" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
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
            © {new Date().getFullYear()} QraftPaper Labs. All rights reserved.
          </p>
          <p className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-fg-subtle">
            <span className="h-1.5 w-1.5 rounded-full bg-fg shadow-[0_0_8px_2px_rgba(255,255,255,0.4)]" />
            All systems operational
          </p>
        </div>
      </div>

      {/* oversized watermark wordmark */}
      <div
        aria-hidden
        className="pointer-events-none select-none text-center text-[18vw] font-semibold leading-[0.8] tracking-tighter text-white/[0.018]"
      >
        QraftPaper
      </div>
    </footer>
  );
}
