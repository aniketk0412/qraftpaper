import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, Lock, Mail, User } from "lucide-react";
import { auth } from "@/auth";
import { AuthField } from "@/components/auth/auth-field";
import { EducationPicker } from "@/components/auth/education-picker";
import { Turnstile } from "@/components/auth/turnstile";
import { GlowButton } from "@/components/ui/glow-button";
import { signupAction } from "../actions";

export const metadata: Metadata = {
  title: "Sign up - QraftPaper",
};

export const runtime = "nodejs";

const errorMessages: Record<string, string> = {
  "email-exists": "That email is already registered. Sign in instead.",
  "invalid-fields":
    "Enter all details and use a password with at least 8 characters.",
  "invalid-grade": "Please pick your level and class/department.",
  "too-many": "Too many sign-ups from your network recently. Please try again later.",
  captcha: "Please complete the verification and try again.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { error } = await searchParams;
  const errorKey = Array.isArray(error) ? error[0] : error;
  const errorMessage = errorKey ? errorMessages[errorKey] : undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gradient">
        Sign up
      </h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        QraftPaper is a paid study tool — no free tier. Create your account
        below; subscribe from the dashboard to start generating mock papers.
      </p>

      <form action={signupAction} className="mt-7 flex flex-col gap-4">
        <AuthField
          id="name"
          name="name"
          label="Your name"
          icon={User}
          placeholder="Anya R."
          autoComplete="name"
        />
        <AuthField
          id="email"
          name="email"
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@somewhere.com"
          autoComplete="email"
        />
        <AuthField
          id="institution"
          name="institution"
          label="College / school"
          icon={Building2}
          placeholder="Parul University"
        />
        <EducationPicker />
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
        from the dashboard once signed in — Solo starts at $7/month, cheaper
        than one tuition class.
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
