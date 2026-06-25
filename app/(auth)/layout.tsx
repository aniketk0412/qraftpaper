import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { GridBackdrop } from "@/components/landing/grid-backdrop";
import { ThemeToggle } from "@/components/theme-toggle";

// NOTE: this layout does NOT redirect signed-in users away. /verify-email,
// /reset-password and /forgot-password are all valid for a signed-in user
// to hit (e.g. just-signed-up account verifying their email, or someone
// resetting their password while still logged in on another device).
// The login + signup pages enforce the "already signed in → /dashboard"
// behaviour themselves.

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthShowcase />
      <div className="relative flex flex-col overflow-hidden">
        {/* On phones the left showcase is hidden, so the form would sit on a
            flat canvas. Bring the branded grid in for small screens only — the
            desktop right column stays clean (the grid lives on the showcase). */}
        <div className="lg:hidden">
          <GridBackdrop />
        </div>
        <div className="flex items-center justify-between px-6 py-6 sm:px-10">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[0.8rem] text-fg-muted transition-colors hover:text-fg"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </Link>
          </div>
        </div>
        {/* Slim brand line for mobile — gives the bare phone view the context
            the desktop showcase provides, in a single unobtrusive row. */}
        <p className="px-6 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-violet-bright sm:px-10 lg:hidden">
          AI exam-prep · built from your syllabus
        </p>
        <div className="flex flex-1 items-center justify-center px-6 pb-14 sm:px-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
