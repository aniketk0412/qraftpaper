import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

// Editorial "letterpress plate" button. No glow, no hover-lift, no fade — a
// crisp ink-bordered plate sitting on a hard 2px offset shadow that collapses
// when pressed (active:translate into the shadow's space). Colour transitions
// are kept short for hover legibility; the press itself is instant. This is
// the shared button across the whole site, so the editorial press language is
// applied everywhere from one place.
const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-[3px] font-medium tracking-tight transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50";

const press =
  "shadow-[var(--shadow-press)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

const variants: Record<Variant, string> = {
  primary: `border border-ink bg-accent text-on-accent hover:bg-accent-hover ${press}`,
  secondary: `border border-ink bg-panel text-fg hover:bg-card-hi ${press}`,
  ghost: "text-fg-muted underline-offset-4 hover:text-fg hover:underline",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.8rem]",
  md: "h-11 px-5 text-sm",
  lg: "h-[3.35rem] px-7 text-[0.95rem]",
};

interface SharedProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = SharedProps &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & {
    href?: undefined;
  };

type AnchorProps = SharedProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children" | "href"> & {
    href: string;
  };

export function GlowButton(props: ButtonProps | AnchorProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    href,
    ...rest
  } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href != null) {
    return (
      <Link
        href={href}
        className={classes}
        {...(rest as Omit<ComponentPropsWithoutRef<typeof Link>, "href">)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...(rest as ComponentPropsWithoutRef<"button">)}
    >
      {children}
    </button>
  );
}
