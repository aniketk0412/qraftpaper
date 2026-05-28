import { MailWarning } from "lucide-react";
import { resendVerificationAction } from "@/app/(auth)/actions";

/**
 * Banner shown at the top of every dashboard page when the logged-in user
 * hasn't verified their email yet. Generation is gated server-side, so this
 * is the only visible signal of "why can't I generate yet?" until they
 * click the email link.
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
            Verify your email to unlock generation
          </p>
          <p className="mt-0.5 text-[0.8rem] text-fg-muted">
            Check your inbox for a link from QraftPaper. You can browse and
            take the sample quiz now, but generating your own papers is
            blocked until you confirm.
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
