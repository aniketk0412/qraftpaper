import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Lock, Mail, User } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { Turnstile } from "@/components/auth/turnstile";
import { GlowButton } from "@/components/ui/glow-button";
import { signupAction } from "../actions";

export const metadata: Metadata = {
  title: "Sign up - QraftPaper",
};

export const runtime = "nodejs";

const errorMessages: Record<string, string> = {
  "email-exists": "That work email already has access. Sign in instead.",
  "invalid-fields":
    "Enter all details and use a password with at least 8 characters.",
  "too-many": "Too many sign-ups from your network recently. Please try again later.",
  captcha: "Please complete the verification and try again.",
};

export default async function SignupPage({
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
        Sign up
      </h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        QraftPaper is a paid platform for institutions. Create your account
        below - you can subscribe and start generating once you sign in.
      </p>

      <form action={signupAction} className="mt-7 flex flex-col gap-4">
        <AuthField
          id="name"
          name="name"
          label="Full name"
          icon={User}
          placeholder="Dr. Anita Rao"
          autoComplete="name"
        />
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
          id="institution"
          name="institution"
          label="Institution"
          icon={Building2}
          placeholder="Meridian University"
        />
        <AuthField
          id="password"
          name="password"
          label="Create password"
          type="password"
          icon={Lock}
          placeholder="********"
          autoComplete="new-password"
        />

        {errorMessage && (
          <p className="rounded-xl border border-line bg-tint/[0.02] px-4 py-3 text-[0.78rem] leading-relaxed text-fg-muted">
            {errorMessage}
          </p>
        )}

        <Turnstile />

        <GlowButton type="submit" size="lg" className="mt-1 w-full">
          Sign up
          <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </form>

      <p className="mt-4 rounded-xl border border-line bg-tint/[0.02] px-4 py-3 text-[0.78rem] leading-relaxed text-fg-muted">
        <span className="font-medium text-fg">No free tier.</span> Subscribe
        from your dashboard once signed in to unlock generation - every plan
        includes a monthly generation allowance.
      </p>

      <p className="mt-5 text-center text-[0.74rem] leading-relaxed text-fg-subtle">
        By signing up you agree to our{" "}
        <Link
          href="/terms"
          className="text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>

      <p className="mt-5 text-center text-[0.82rem] text-fg-muted">
        Already have access?{" "}
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
