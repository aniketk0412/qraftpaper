"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BookMarked,
  ChevronDown,
  FileOutput,
  FileText,
  FileUp,
  Fingerprint,
  Layers3,
  ListChecks,
  Menu,
  PencilRuler,
  ScanSearch,
  Scale,
  Sliders,
  Sparkles,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { GlowButton } from "@/components/ui/glow-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { easeOut } from "@/lib/motion";
import { PRICING_TIERS } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface MenuRow {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
}

const featureRows: MenuRow[] = [
  { icon: Layers3, title: "Real exam structure", desc: "Sections and marks like your paper", href: "#features" },
  { icon: ScanSearch, title: "Trained on your PYQs", desc: "Mirrors your prof's style", href: "#features" },
  { icon: Scale, title: "Blueprint-match score", desc: "Live % vs the structure you set", href: "#features" },
  { icon: BookMarked, title: "Difficulty you control", desc: "Set Easy / Medium / Hard split", href: "#features" },
  { icon: Fingerprint, title: "No repeats", desc: "Won't ask the same Q twice", href: "#features" },
  { icon: FileOutput, title: "Print, share, retake", desc: "PDF, Word and public quiz links", href: "#features" },
];

const howRows: MenuRow[] = [
  { icon: FileUp, title: "Upload syllabus + PYQ", desc: "One combined PDF or separate files", href: "#how" },
  { icon: Sliders, title: "Set the exam format", desc: "Marks, sections, difficulty", href: "#how" },
  { icon: Wand2, title: "Practise & retake", desc: "Print, share with friends, retry", href: "#how" },
];

const showcaseRows: MenuRow[] = [
  { icon: FileText, title: "Sample question paper", desc: "Real generated output", href: "#showcase" },
  { icon: ListChecks, title: "Sample quiz", desc: "AI-generated quiz preview", href: "#quiz" },
  { icon: PencilRuler, title: "How editing works", desc: "Inline edit & regenerate", href: "#features" },
];

const quizRows: MenuRow[] = [
  { icon: Sparkles, title: "How quiz generation works", desc: "Quizzes from syllabus + PYQs", href: "#quiz" },
  { icon: ListChecks, title: "Try the interactive quiz", desc: "Pick answers and see explanations", href: "#quiz" },
];

// Read straight from PRICING_TIERS so the nav dropdown can never drift from
// the real pricing section / billing limits.
const pricingTiers = PRICING_TIERS.map((tier) => ({
  name: tier.name,
  price: tier.period ? `${tier.price} ${tier.period}`.trim() : tier.price,
}));

type MenuKey = "features" | "quiz" | "how" | "showcase" | "pricing";

interface NavItem {
  key: string;
  label: string;
  href: string;
  hasMenu: boolean;
}

const navItems: NavItem[] = [
  { key: "features", label: "Features", href: "#features", hasMenu: true },
  { key: "quiz", label: "Quiz", href: "#quiz", hasMenu: true },
  { key: "how", label: "How it works", href: "#how", hasMenu: true },
  { key: "showcase", label: "Showcase", href: "#showcase", hasMenu: true },
  { key: "pricing", label: "Pricing", href: "#pricing", hasMenu: true },
  { key: "faq", label: "FAQ", href: "#faq", hasMenu: false },
  { key: "dashboard", label: "Dashboard", href: "/dashboard", hasMenu: false },
];

export function SiteNav({ signedIn = false }: { signedIn?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 16;
      setScrolled((prev) => (prev === next ? prev : next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <AnimatePresence>
        {active && (
          <motion.div
            key="nav-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: easeOut }}
            className="fixed inset-0 -z-10 bg-ink/65 backdrop-blur-lg"
          />
        )}
      </AnimatePresence>
      <div
        className={cn(
          "border-b transition-all duration-500",
          scrolled || active
            ? "border-line bg-canvas/85 backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo />

          <div
            className="hidden items-center gap-0.5 lg:flex"
            onMouseLeave={() => setActive(null)}
          >
            {navItems.map((item) => (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => setActive(item.hasMenu ? item.key : null)}
              >
                <Link
                  href={item.href}
                  onClick={() => setActive(null)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                    active === item.key
                      ? "text-fg"
                      : "text-fg-muted hover:text-fg",
                  )}
                >
                  {item.label}
                  {item.hasMenu && (
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 transition-transform duration-300",
                        active === item.key && "rotate-180",
                      )}
                    />
                  )}
                </Link>

                <AnimatePresence>
                  {item.hasMenu && active === item.key && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.22, ease: easeOut }}
                      className="absolute left-1/2 top-full -translate-x-1/2 pt-3"
                    >
                      <NavMenu menuKey={item.key as MenuKey} onNavigate={() => setActive(null)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <ThemeToggle />
            {signedIn ? (
              <GlowButton href="/dashboard" variant="primary" size="md">
                Open dashboard
              </GlowButton>
            ) : (
              <>
                <GlowButton href="/login" variant="ghost" size="md">
                  Sign in
                </GlowButton>
                <GlowButton href="/signup" variant="primary" size="md">
                  Sign up
                </GlowButton>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full glass-strong"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mx-4 mt-2 rounded-2xl glass-strong p-4 lg:hidden"
          >
            <div className="flex flex-col">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-fg-muted transition-colors hover:bg-tint/5 hover:text-fg"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-line pt-4">
                {signedIn ? (
                  <GlowButton href="/dashboard" variant="primary" size="md">
                    Open dashboard
                  </GlowButton>
                ) : (
                  <>
                    <GlowButton href="/login" variant="secondary" size="md">
                      Sign in
                    </GlowButton>
                    <GlowButton href="/signup" variant="primary" size="md">
                      Sign up
                    </GlowButton>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavMenu({
  menuKey,
  onNavigate,
}: {
  menuKey: MenuKey;
  onNavigate: () => void;
}) {
  if (menuKey === "pricing") {
    return (
      <Panel className="w-[320px]">
        <p className="px-3 pb-1 pt-1 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-fg-subtle">
          Plans — no free tier
        </p>
        {pricingTiers.map((t) => (
          <Link
            key={t.name}
            href="#pricing"
            onClick={onNavigate}
            className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-tint/[0.05]"
          >
            <span className="text-sm font-medium">{t.name}</span>
            <span className="font-mono text-[0.72rem] text-fg-muted">
              {t.price}
            </span>
          </Link>
        ))}
        <MenuFooter href="#pricing" label="Compare all plans" onNavigate={onNavigate} />
      </Panel>
    );
  }

  const config: Record<
    Exclude<MenuKey, "pricing">,
    { rows: MenuRow[]; width: string; cols: boolean; footerHref: string; footerLabel: string }
  > = {
    features: {
      rows: featureRows,
      width: "w-[560px]",
      cols: true,
      footerHref: "#features",
      footerLabel: "Explore the platform",
    },
    quiz: {
      rows: quizRows,
      width: "w-[380px]",
      cols: false,
      footerHref: "#quiz",
      footerLabel: "See quiz generation",
    },
    how: {
      rows: howRows,
      width: "w-[340px]",
      cols: false,
      footerHref: "#how",
      footerLabel: "See the full workflow",
    },
    showcase: {
      rows: showcaseRows,
      width: "w-[340px]",
      cols: false,
      footerHref: "#showcase",
      footerLabel: "View live output",
    },
  };

  const { rows, width, cols, footerHref, footerLabel } = config[menuKey];

  return (
    <Panel className={width}>
      <div className={cn("grid gap-0.5", cols && "grid-cols-2")}>
        {rows.map((row) => (
          <Link
            key={row.title}
            href={row.href}
            onClick={onNavigate}
            className="group/row flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-tint/[0.05]"
          >
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-tint/[0.04] text-violet-bright ring-1 ring-line transition-colors group-hover/row:bg-violet/15">
              <row.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.84rem] font-medium leading-tight">
                {row.title}
              </span>
              <span className="mt-0.5 block text-[0.74rem] leading-snug text-fg-muted">
                {row.desc}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <MenuFooter href={footerHref} label={footerLabel} onNavigate={onNavigate} />
    </Panel>
  );
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl glass-strong p-2 shadow-2xl",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-tint/25 to-transparent" />
      {children}
    </div>
  );
}

function MenuFooter({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="mt-1 flex items-center justify-between rounded-xl border-t border-line px-3 py-2.5 text-[0.78rem] text-fg-muted transition-colors hover:text-fg"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}
