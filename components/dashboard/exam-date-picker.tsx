"use client";

import { CalendarClock, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Inline exam-date picker rendered on each subject card. Today the only
 * "input" is a native `<input type="date">` which behaves natively on every
 * mobile and desktop browser. Clearing the date is a separate small button.
 *
 * On submit we PATCH /api/subjects/[id], then `router.refresh()` so the
 * card's countdown chip updates without a hard reload.
 */
export function ExamDatePicker({
  subjectId,
  currentValue,
}: {
  subjectId: string;
  /** ISO date "YYYY-MM-DD" or null. */
  currentValue: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentValue ?? "");
  const [pending, setPending] = useState(false);

  async function save(next: string | null) {
    setPending(true);
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate: next }),
      });
      if (response.ok) {
        setValue(next ?? "");
        setOpen(false);
        router.refresh();
      }
    } catch {
      /* swallow */
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-[0.74rem] text-fg-muted transition-colors hover:text-fg"
      >
        <CalendarClock className="h-3.5 w-3.5" />
        {currentValue ? "Change exam date" : "Set exam date"}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        min={new Date().toISOString().slice(0, 10)}
        className="h-9 rounded-lg border border-line bg-tint/[0.02] px-2.5 text-[0.78rem] text-fg focus:border-violet/50 focus:outline-none focus:ring-2 focus:ring-violet/20"
      />
      <button
        type="button"
        disabled={pending || !value}
        onClick={() => save(value || null)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-3 text-[0.74rem] font-medium text-on-accent transition-colors hover:bg-[#247373] disabled:opacity-60"
      >
        {pending && <Loader2 className="h-3 w-3 animate-spin" />}
        Save
      </button>
      {currentValue && (
        <button
          type="button"
          disabled={pending}
          onClick={() => save(null)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-tint/[0.02] px-3 text-[0.74rem] text-fg-muted transition-colors hover:text-fg"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setOpen(false);
          setValue(currentValue ?? "");
        }}
        className="text-[0.74rem] text-fg-subtle transition-colors hover:text-fg-muted"
      >
        Cancel
      </button>
    </div>
  );
}
