import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";
import { auth } from "@/auth";
import { AuthField } from "@/components/auth/auth-field";
import { PasswordField } from "@/components/auth/password-field";
import { FormError } from "@/components/ui/form-error";
import { GlowButton } from "@/components/ui/glow-button";
import { loginAction } from "../actions";

export const metadata: Metadata = {
  title: "Sign in - QraftPaper",
};

export const runtime = "nodejs";

const errorMessages: Record<string, string> = {
  "invalid-credentials": "Use a valid email and password.",
  "missing-fields": "Enter your email and password.",
  "signin-after-signup":
    "Your account was created. Sign in once to continue to your account.",
};

const statusMessages: Record<string, string> = {
  success: "Your password has been updated. Sign in with the new password.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; reset?: string | string[] }>;
}) {
  // Already signed in? Skip the form entirely — moved out of (auth)/layout
  // so /verify-email and /reset-password remain accessible while logged in.
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const { error, reset } = await searchParams;
  const errorKey = Array.isArray(error) ? error[0] : error;
  const resetKey = Array.isArray(reset) ? reset[0] : reset;
  const errorMessage = errorKey ? errorMessages[errorKey] : undefined;
  const statusMessage = resetKey ? statusMessages[resetKey] : undefined;

  return (
    <div className="animate-rise">
      <h1 className="text-2xl font-semibold tracking-tight text-gradient">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        Sign back in to keep practising.
      </p>

      <form action={loginAction} className="mt-8 flex flex-col gap-4">
        <AuthField
          id="email"
          name="email"
          label="Email"
          type="email"
          icon={Mail}
          placeholder="you@somewhere.com"
          autoComplete="email"
        />
        <PasswordField
          id="password"
          name="password"
          label="Password"
          placeholder="********"
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-[0.78rem] text-fg-muted">
            <input
              type="checkbox"
              name="remember"
              defaultChecked
              className="h-3.5 w-3.5 rounded border-line bg-tint/[0.03] accent-violet"
            />
            Keep me signed in
          </label>
          <Link
            href="/forgot-password"
            className="text-[0.78rem] text-violet-bright transition-colors hover:text-violet"
          >
            Forgot password?
          </Link>
        </div>

        {errorMessage && <FormError>{errorMessage}</FormError>}
        {statusMessage && (
          <p className="rounded-xl border border-accent/25 bg-accent/[0.08] px-4 py-3 text-[0.78rem] leading-relaxed text-fg-muted">
            {statusMessage}
          </p>
        )}

        <GlowButton type="submit" size="lg" className="mt-1 w-full">
          Sign in
          <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </form>

      <p className="mt-8 text-center text-[0.82rem] text-fg-muted">
        New to QraftPaper?{" "}
        <Link
          href="/signup"
          className="font-medium text-violet-bright transition-colors hover:text-violet"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
