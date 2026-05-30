"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Horizontal row of subject pills above a list. The "All" pill clears the
 * filter; tapping a subject pill sets ?subject=<id>. Active pill highlights
 * in violet so the filter state is obvious at a glance.
 *
 * Server-side filtering reads `?subject=` and narrows the query — we do not
 * filter client-side, both for correctness (pagination changes) and so
 * search-engine-style URLs stay shareable.
 */
export function SubjectFilter({
  paramName = "subject",
  options,
}: {
  paramName?: string;
  options: { id: string; code: string }[];
}) {
  const params = useSearchParams();
  const current = params.get(paramName);

  // Build URLs that preserve all OTHER existing query params (search term,
  // etc.) but reset ?page=1 — any filter change invalidates the current
  // pagination window.
  function hrefFor(id: string | null): string {
    const url = new URLSearchParams(params.toString());
    if (id) {
      url.set(paramName, id);
    } else {
      url.delete(paramName);
    }
    url.delete("page");
    const qs = url.toString();
    return qs ? `?${qs}` : "?";
  }

  // Don't render if there's only one subject — the filter would be a no-op
  // ("All" and "MATH101" pick the same set).
  if (options.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <FilterPill href={hrefFor(null)} active={!current} label="All subjects" />
      {options.map((s) => (
        <FilterPill
          key={s.id}
          href={hrefFor(s.id)}
          active={current === s.id}
          label={s.code}
        />
      ))}
    </div>
  );
}

function FilterPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-8 items-center rounded-full px-3 font-mono text-[0.66rem] uppercase tracking-[0.14em] transition-colors",
        active
          ? "bg-violet/15 text-violet-bright ring-1 ring-violet/30"
          : "bg-tint/[0.03] text-fg-muted ring-1 ring-line hover:bg-tint/[0.06] hover:text-fg",
      )}
    >
      {label}
    </Link>
  );
}
