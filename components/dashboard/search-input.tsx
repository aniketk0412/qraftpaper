"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Search box that reflects its value into a URL query param so the server
 * component above re-runs the DB query with the new filter. Uses an internal
 * debounce so we don't fire a request on every keystroke — feels native and
 * keeps DB load proportional to user intent, not typing speed.
 *
 * The URL is the source of truth (query string + ?page=1 reset on a fresh
 * search), so this also keeps back/forward navigation honest: hitting back
 * actually undoes the search instead of leaving the UI in a half-state.
 */
export function SearchInput({
  paramName = "q",
  placeholder = "Search...",
  debounceMs = 250,
  className,
}: {
  paramName?: string;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const urlValue = params.get(paramName) ?? "";
  const [draft, setDraft] = useState(urlValue);
  const [urlSnapshot, setUrlSnapshot] = useState(urlValue);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When the URL value changes from outside (e.g. user clicks Clear search
  // from an empty-state link, or the back button), adopt the new value
  // synchronously during render — no effect needed. React's
  // "setState-during-render to sync prop changes" pattern.
  if (urlValue !== urlSnapshot) {
    setUrlSnapshot(urlValue);
    setDraft(urlValue);
  }
  const value = draft;
  const setValue = setDraft;

  function push(next: string) {
    const url = new URLSearchParams(params.toString());
    if (next.trim()) {
      url.set(paramName, next.trim());
    } else {
      url.delete(paramName);
    }
    // Whenever the search term changes, jump back to page 1 — the previous
    // page number wouldn't make sense against a smaller filtered list.
    url.delete("page");
    const qs = url.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push(next), debounceMs);
  }

  function clear() {
    setValue("");
    if (timer.current) clearTimeout(timer.current);
    push("");
  }

  return (
    <div
      className={cn(
        "relative flex h-10 items-center rounded-full border border-line bg-tint/[0.03] px-3 transition-colors focus-within:border-line-strong focus-within:bg-tint/[0.05]",
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-fg-subtle" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="ml-2.5 h-full w-full min-w-0 bg-transparent text-[0.86rem] text-fg placeholder:text-fg-subtle focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="ml-2 grid h-6 w-6 shrink-0 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-tint/[0.06] hover:text-fg"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
