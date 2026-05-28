"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Confirm-and-delete button shared by the subjects, papers and quizzes lists.
 * Two clicks to fire: first reveals "Yes, delete", second commits the DELETE.
 * Refreshes the parent route so the row disappears without a manual reload.
 */
export function DeleteButton({
  endpoint,
  label,
  className,
}: {
  /** Absolute API path, e.g. `/api/subjects/123` */
  endpoint: string;
  /** Short noun for the confirm copy, e.g. "subject" / "paper" / "quiz". */
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function commit() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? `Could not delete ${label}.`);
        setPending(false);
        return;
      }
      router.refresh();
    } catch {
      setError(`Could not delete ${label}.`);
      setPending(false);
    }
  }

  if (confirming) {
    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <button
          type="button"
          onClick={commit}
          disabled={pending}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-tint/[0.06] px-3 text-[0.78rem] font-medium text-fg ring-1 ring-line transition-colors hover:bg-tint/[0.1] disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Yes, delete
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={pending}
          className="text-[0.78rem] text-fg-muted transition-colors hover:text-fg"
        >
          Cancel
        </button>
        {error && (
          <span className="text-[0.74rem] text-fg-muted">{error}</span>
        )}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${label}`}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-tint/[0.02] px-3 text-[0.78rem] text-fg-muted transition-colors hover:border-line-strong hover:text-fg",
        className,
      )}
    >
      <Trash2 className="h-3.5 w-3.5" />
      Delete
    </button>
  );
}
