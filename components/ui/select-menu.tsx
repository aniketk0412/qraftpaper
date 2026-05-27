"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

export function SelectMenu({
  options,
  value,
  onChange,
  placeholder = "Select…",
  emptyLabel = "No options",
  emptyHint,
  className,
  ariaLabel,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  emptyHint?: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value);
  const isEmpty = options.length === 0;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-canvas px-3.5 text-sm transition-all duration-200",
          open
            ? "border-violet/50 ring-2 ring-violet/20"
            : "border-line hover:border-line-strong",
        )}
      >
        <span className={cn("truncate", selected ? "text-fg" : "text-fg-subtle")}>
          {selected ? selected.label : isEmpty ? emptyLabel : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-fg-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: easeOut }}
            data-lenis-prevent
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-line-strong bg-card-hi/80 p-1.5 shadow-2xl backdrop-blur-2xl"
          >
            {isEmpty ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[0.82rem] font-medium text-fg-muted">
                  {emptyLabel}
                </p>
                {emptyHint && (
                  <div className="mt-1 text-[0.74rem] text-fg-subtle">
                    {emptyHint}
                  </div>
                )}
              </div>
            ) : (
              options.map((option) => {
                const active = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.84rem] transition-colors",
                      active
                        ? "bg-tint/[0.06] text-fg"
                        : "text-fg-muted hover:bg-tint/[0.04] hover:text-fg",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.hint && (
                        <span className="block truncate text-[0.72rem] text-fg-subtle">
                          {option.hint}
                        </span>
                      )}
                    </span>
                    {active && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
