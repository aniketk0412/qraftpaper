import { MailWarning } from "lucide-react";
import { resendVerificationAction } from "@/app/(auth)/actions";

/**
 * Banner shown at the top of every dashboard page when the logged-in user
 * hasn't verified their email yet. Generation is intentionally NOT gated
 * on email verification — students need to try the product on day 1, and
 * gating would tank activation. The banner is a soft reminder ("we need
 * a way to reach you about billing") with a resend CTA, not a paywall.
 */
export function VerifyEmailBanner() {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold/35 bg-gold/[0.08] p-4 text-fg sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
          <MailWarning className="h-4 w-4" />
        </span>
        <div className="leading-snug">
          <p className="text-[0.92rem] font-medium">
            Confirm your email so you don&apos;t lose your account
          </p>
          <p className="mt-0.5 text-[0.8rem] text-fg-muted">
            Check your inbox — we sent a one-click link from QraftPaper.
            You can keep practising in the meantime, but a verified email
            is how we reach you if anything goes wrong with your subscription.
          </p>
        </div>
      </div>
      <form
        action={resendVerificationAction}
        className="shrink-0 self-start sm:self-auto"
      >
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1.5 rounded-full glass-strong px-4 text-[0.78rem] font-medium text-fg transition-colors hover:bg-tint/[0.08]"
        >
          Resend email
        </button>
      </form>
    </div>
  );
}
