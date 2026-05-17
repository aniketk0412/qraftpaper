import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Lock, Mail } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { GlowButton } from "@/components/ui/glow-button";
import { loginAction } from "../actions";

export const metadata: Metadata = {
  title: "Sign in — QraftPaper",
};

export const runtime = "nodejs";

const errorMessages: Record<string, string> = {
  "invalid-credentials": "Use a valid work email and password.",
  "missing-fields": "Enter your work email and password.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  const errorKey = Array.isArray(error) ? error[0] : error;
  const errorMessage = errorKey ? errorMessages[errorKey] : undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gradient">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        Sign in to your examination workspace.
      </p>

      <form action={loginAction} className="mt-8 flex flex-col gap-4">
        <AuthField
          id="email"
          name="email"
          label="Work email"
          type="email"
          icon={Mail}
          placeholder="you@institution.edu"
          autoComplete="email"
        />
        <AuthField
          id="password"
          name="password"
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••••"
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[0.78rem] text-fg-muted">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-line bg-white/[0.03] accent-violet"
            />
            Keep me signed in
          </label>
          <Link
            href="#"
            className="text-[0.78rem] text-violet-bright transition-colors hover:text-violet"
          >
            Forgot password?
          </Link>
        </div>

        {errorMessage && (
          <p className="rounded-xl border border-line bg-white/[0.02] px-4 py-3 text-[0.78rem] leading-relaxed text-fg-muted">
            {errorMessage}
          </p>
        )}

        <GlowButton type="submit" size="lg" className="mt-1 w-full">
          Sign in
          <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="font-mono text-[0.64rem] uppercase tracking-[0.2em] text-fg-subtle">
          or
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <GlowButton
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        disabled
      >
        <Building2 className="h-4 w-4" />
        Continue with institutional SSO
      </GlowButton>

      <p className="mt-8 text-center text-[0.82rem] text-fg-muted">
        New to QraftPaper?{" "}
        <Link
          href="/signup"
          className="font-medium text-violet-bright transition-colors hover:text-violet"
        >
          Request access
        </Link>
      </p>
    </div>
  );
}
