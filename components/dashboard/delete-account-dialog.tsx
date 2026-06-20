"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { easeOut } from "@/lib/motion";

const CONSEQUENCES = [
  "All your subjects and their uploaded source material",
  "Every question paper and blueprint you've created",
  "All quizzes and your quiz attempt history",
  "Your study streak and activity history",
];

/**
 * Professional, themed account-deletion flow. A plain button opens a modal that
 * spells out — in plain bullets — exactly what is destroyed and that it cannot
 * be recovered, then gates the irreversible action behind typing "DELETE".
 * The server action (deleteAccountAction) re-checks the same word, so this is a
 * UX guard, never the security control.
 */
export function DeleteAccountDialog({
  action,
  showConfirmError = false,
}: {
  /** Server action that performs the deletion (expects a `confirmation` field). */
  action: (formData: FormData) => void | Promise<void>;
  /** Re-open the modal when the server bounced back a confirmation mismatch. */
  showConfirmError?: boolean;
}) {
  const [open, setOpen] = useState(showConfirmError);
  const [typed, setTyped] = useState("");
  const confirmed = typed.trim() === "DELETE";

  // Portal target is only available on the client. Gate the portal on mount so
  // SSR renders nothing for the overlay (the trigger button still renders).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Client-only mount flag for the portal; runs once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Lock background scroll + wire Escape-to-close while the modal is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gold/45 bg-gold/15 px-5 text-[0.86rem] font-medium text-gold transition-colors hover:bg-gold/25"
      >
        <Trash2 className="h-4 w-4" />
        Delete my account
      </button>

      {/* Portal to <body> so the overlay escapes transformed ancestors (the
          GlassCard/Reveal motion wrappers + Lenis smooth-scroll container).
          Without this, `position: fixed` resolves against the nearest
          transformed ancestor instead of the viewport and the modal drifts
          toward the bottom of the page instead of centering. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
            {/* Scrim — clicking it cancels, matching the app's other overlays. */}
            <div
              className="absolute inset-0 bg-ink/70 backdrop-blur-md"
              onClick={() => setOpen(false)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-account-title"
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl glass-strong p-6"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: easeOut }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-tint/[0.06] hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>

              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30">
                <AlertTriangle className="h-5 w-5" />
              </span>

              <h2
                id="delete-account-title"
                className="mt-4 text-lg font-semibold tracking-tight text-fg"
              >
                Delete your account?
              </h2>
              <p className="mt-1.5 text-[0.84rem] leading-relaxed text-fg-muted">
                This is permanent. Once deleted, your account and everything in
                it{" "}
                <span className="font-medium text-fg">cannot be recovered</span>
                . We do not keep a backup.
              </p>

              <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-fg-subtle">
                What gets permanently erased
              </p>
              <ul className="mt-2 flex flex-col gap-2">
                {CONSEQUENCES.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[0.82rem] leading-snug text-fg-muted"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/70" />
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-4 rounded-xl border border-gold/30 bg-gold/[0.08] px-3.5 py-3 text-[0.78rem] leading-relaxed text-fg">
                On a paid plan? Cancel it from{" "}
                <span className="font-medium">Billing</span> first — deleting your
                account here removes your data but won&apos;t stop future charges
                from the payment provider.
              </p>

              <form action={action} className="mt-5">
                <label
                  htmlFor="delete-confirmation"
                  className="text-[0.78rem] text-fg-muted"
                >
                  Type{" "}
                  <span className="rounded bg-tint/[0.06] px-1.5 py-0.5 font-mono text-[0.74rem] font-medium text-fg">
                    DELETE
                  </span>{" "}
                  to confirm
                </label>
                <input
                  id="delete-confirmation"
                  name="confirmation"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  autoFocus
                  placeholder="DELETE"
                  className="mt-2 h-11 w-full rounded-xl border border-line bg-tint/[0.03] px-3.5 text-sm text-fg placeholder:text-fg-subtle transition-all duration-200 focus:border-gold/50 focus:bg-tint/[0.05] focus:outline-none focus:ring-2 focus:ring-gold/20"
                />

                {showConfirmError && (
                  <p className="mt-2 text-[0.76rem] text-gold">
                    That didn&apos;t match. Type DELETE exactly.
                  </p>
                )}

                <div className="mt-5 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-tint/[0.03] px-5 text-[0.86rem] font-medium text-fg-muted transition-colors hover:bg-tint/[0.06] hover:text-fg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!confirmed}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gold/45 bg-gold/15 px-5 text-[0.86rem] font-medium text-gold transition-colors hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gold/15"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete forever
                  </button>
                </div>
              </form>
              </motion.div>
            </motion.div>
          )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
