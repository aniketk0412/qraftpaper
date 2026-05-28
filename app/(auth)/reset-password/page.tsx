import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { GlowButton } from "@/components/ui/glow-button";
import { resetPasswordAction } from "../actions";

export const metadata: Metadata = {
  title: "Choose new password - QraftPaper",
};

export const runtime = "nodejs";

const errorMessages: Record<string, string> = {
  "invalid-fields": "Use a password with at least 8 characters.",
  "invalid-token": "This reset link is invalid or expired. Request a new one.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>;
}) {
  const { token, error } = await searchParams;
  const tokenValue = Array.isArray(token) ? token[0] : token;
  const errorKey = Array.isArray(error) ? error[0] : error;
  const errorMessage = errorKey ? errorMessages[errorKey] : undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-gradient">
        Choose a new password
      </h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        Set a new password for your QraftPaper workspace.
      </p>

      <form action={resetPasswordAction} className="mt-7 flex flex-col gap-4">
        <input type="hidden" name="token" value={tokenValue ?? ""} />
        <AuthField
          id="password"
          name="password"
          label="New password"
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

        <GlowButton type="submit" size="lg" className="mt-1 w-full">
          Update password
          <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </form>

      <p className="mt-6 text-center text-[0.82rem] text-fg-muted">
        Need a fresh link?{" "}
        <Link
          href="/forgot-password"
          className="font-medium text-violet-bright transition-colors hover:text-violet"
        >
          Request another
        </Link>
      </p>
    </div>
  );
}

