import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MailCheck } from "lucide-react";
import { GlowButton } from "@/components/ui/glow-button";
import { verifyEmailAction } from "../actions";

export const metadata: Metadata = {
  title: "Verify email — QraftPaper",
  // Token-bearing URL — never let any crawler index it.
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";

/**
 * Two states:
 *  1. `?token=…` — render an auto-submitting form that POSTs the token to the
 *     server action. Server action redirects to /dashboard?verified=1 on
 *     success or /verify-email?error=invalid-token on failure.
 *  2. `?error=…` — render the failure copy with a path back.
 *
 * Auto-submit is gated behind real markup with JS-only auto-fire — accessible
 * to keyboard users, and the visible Verify button works without JS too.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string | string[];
    error?: string | string[];
  }>;
}) {
  const { token, error } = await searchParams;
  const tokenValue = Array.isArray(token) ? token[0] : token;
  const errorKey = Array.isArray(error) ? error[0] : error;

  if (errorKey === "invalid-token") {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gradient">
          Link expired
        </h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          This verification link has either been used already or expired.
          Sign in and request a new one from the banner on your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <GlowButton href="/login" size="md">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </GlowButton>
          <Link
            href="/"
            className="text-[0.82rem] text-fg-muted transition-colors hover:text-fg"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!tokenValue) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gradient">
          Check your inbox
        </h1>
        <p className="mt-1.5 text-sm text-fg-muted">
          We sent a verification link to your email. Click it and you&apos;ll be
          all set. If it&apos;s not there, check spam — Resend sometimes lands
          there until you mark it as not-spam once.
        </p>
        <div className="mt-6">
          <GlowButton href="/login" size="md">
            Already verified? Sign in
            <ArrowRight className="h-4 w-4" />
          </GlowButton>
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30">
        <MailCheck className="h-5 w-5" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gradient">
        Confirming your email
      </h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        Click the button below to finish verification. We&apos;ll redirect you
        to your dashboard.
      </p>

      <form action={verifyEmailAction} className="mt-7 flex flex-col gap-3">
        <input type="hidden" name="token" value={tokenValue} />
        <GlowButton type="submit" size="lg" className="w-full">
          Verify email
          <ArrowRight className="h-4 w-4" />
        </GlowButton>
      </form>

      {/*
        Auto-submit the form on mount so users who land here from the email
        link don't need an extra click. Falls back gracefully if JS is off —
        the visible Verify button still works.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              try {
                var f = document.querySelector('form[action]');
                if (f) setTimeout(function(){ f.requestSubmit(); }, 200);
              } catch(e) {}
            })();
          `,
        }}
      />
    </div>
  );
}
