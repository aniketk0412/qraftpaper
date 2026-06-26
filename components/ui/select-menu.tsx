"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

// Floating, portal-rendered select that escapes overflow-hidden ancestors.

/** Fixed-position coordinates for the floating panel, in viewport space. */
interface PanelPos {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
  openUp: boolean;
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
  const [pos, setPos] = useState<PanelPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((option) => option.value === value);
  const isEmpty = options.length === 0;

  // Measure the trigger and place the panel in viewport (fixed) coordinates so
  // it escapes any overflow-hidden ancestor (e.g. GlassCard). Flips above the
  // trigger when there isn't room below — important for selects low on screen.
  const reposition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 8;
    const spaceBelow = window.innerHeight - r.bottom;
    const spaceAbove = r.top;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const avail = (openUp ? spaceAbove : spaceBelow) - gap - 8;
    setPos({
      left: r.left,
      width: r.width,
      top: openUp ? undefined : r.bottom + gap,
      bottom: openUp ? window.innerHeight - r.top + gap : undefined,
      maxHeight: Math.min(256, Math.max(140, avail)),
      openUp,
    });
  }, []);

  function toggle() {
    if (!open) reposition();
    setOpen((v) => !v);
  }

  // While open, keep the panel pinned to the trigger through scroll/resize, and
  // close on outside click or Escape. The portal lives outside the trigger's
  // DOM subtree, so the outside check must accept clicks inside the panel too.
  useEffect(() => {
    if (!open) return;
    function onScrollResize() {
      reposition();
    }
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    // capture: catch scrolls in any scrollable ancestor, not just window.
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, reposition]);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
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

      {/* Render after mount only — the panel opens on user click (post-
          hydration), so the SSR/first-client tree stays identical (no portal). */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && (
              <motion.div
                ref={panelRef}
                id={listId}
                role="listbox"
                initial={{ opacity: 0, y: pos.openUp ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: pos.openUp ? 4 : -4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: easeOut }}
                data-lenis-prevent
                style={{
                  position: "fixed",
                  left: pos.left,
                  width: pos.width,
                  top: pos.top,
                  bottom: pos.bottom,
                  maxHeight: pos.maxHeight,
                }}
                className="z-[80] overflow-y-auto overscroll-contain rounded-xl border border-line-strong bg-card-hi/80 p-1.5 shadow-2xl backdrop-blur-2xl"
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
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
