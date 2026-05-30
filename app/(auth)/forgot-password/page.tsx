import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { GlowButton } from "@/components/ui/glow-button";
import { requestPasswordResetAction } from "../actions";

export const metadata: Metadata = {
  title: "Reset password - QraftPaper",
  // Recovery flow — keep it out of search indexes.
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string | string[] }>;
}) {
  const { sent } = await searchParams;
  const didSend = (Array.isArray(sent) ? sent[0] : sent) === "1";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gradient">
        Reset password
      </h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        Enter your email. If an account exists we&apos;ll send a reset link
        that expires in 30 minutes.
      </p>

      <form action={requestPasswordResetAction} className="mt-7 flex flex-col gap-4">
        <AuthField
          id="email"
          name="email"
          label="Work email"
          type="email"
          icon={Mail}
          placeholder="you@institution.edu"
          autoComplete="email"
        />

        {didSend && (
          <p className="rounded-xl border border-line bg-tint/[0.02] px-4 py-3 text-[0.78rem] leading-relaxed text-fg-muted">
            If that email has a QraftPaper account, a reset link has been sent.
          </p>
        )}

        <GlowButton type="submit" size="lg" className="mt-1 w-full">
          Send reset link
          <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </form>

      <p className="mt-6 text-center text-[0.82rem] text-fg-muted">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-violet-bright transition-colors hover:text-violet"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

