import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all duration-300 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-on-accent shadow-[0_10px_30px_-12px_rgba(45,139,139,0.55)] hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-[0_16px_44px_-14px_rgba(45,139,139,0.6)]",
  secondary:
    "glass-strong text-fg hover:-translate-y-0.5 hover:bg-tint/[0.08]",
  ghost: "text-fg-muted hover:text-fg",
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
