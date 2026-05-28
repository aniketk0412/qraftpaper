"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bell, BellOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Notifications() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Notifications aren't wired to a real event stream yet — show an honest
  // empty state instead of seeding fake "Prof. Mensah shared a blueprint"
  // entries to every signed-in user.
  const unread = 0;

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
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-full glass transition-colors",
          open ? "text-fg" : "text-fg-muted hover:text-fg",
        )}
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute right-2 top-2 grid h-3.5 w-3.5 place-items-center rounded-full bg-accent text-[0.5rem] font-bold text-on-accent ring-2 ring-canvas">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="notif"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: easeOut }}
            className="absolute right-0 top-full z-50 mt-2 w-[21rem] overflow-hidden rounded-2xl border border-line-strong bg-card-hi/80 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-sm font-medium">Notifications</p>
            </div>

            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-tint/[0.04] text-fg-subtle ring-1 ring-line">
                <BellOff className="h-4 w-4" />
              </span>
              <p className="text-[0.82rem] font-medium text-fg">
                No notifications yet
              </p>
              <p className="max-w-[16rem] text-[0.74rem] leading-snug text-fg-subtle">
                Alerts will appear here after notification events are connected.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
