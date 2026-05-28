"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { GlowButton } from "@/components/ui/glow-button";
import { allNav } from "@/lib/dashboard-nav";
import { easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function MobileNav({ plan = "unpaid" }: { plan?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const showUpgrade = plan === "unpaid";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-full glass text-fg-muted transition-colors hover:text-fg"
        aria-label="Open menu"
      >
        <Menu className="h-[18px] w-[18px]" />
      </button>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="drawer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-[100] lg:hidden"
              >
                <div
                  className="absolute inset-0 bg-ink/75 backdrop-blur-sm"
                  onClick={() => setOpen(false)}
                />
                <motion.aside
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ duration: 0.34, ease: easeOut }}
                  className="absolute inset-y-0 left-0 flex h-full w-[280px] flex-col border-r border-line bg-panel"
                >
                  <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
                    <Logo />
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="grid h-9 w-9 place-items-center rounded-full glass text-fg-muted transition-colors hover:text-fg"
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                    {allNav.map((item) => {
                      const active = item.href === pathname;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
                            active
                              ? "bg-accent/15 text-fg ring-1 ring-accent/30"
                              : "text-fg-muted hover:bg-tint/[0.04] hover:text-fg",
                          )}
                        >
                          <item.icon
                            className={cn(
                              "h-[18px] w-[18px]",
                              active ? "text-accent" : "text-fg-subtle",
                            )}
                          />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>

                  {showUpgrade && (
                    <div className="shrink-0 border-t border-line p-4">
                      <GlowButton href="/billing" size="md" className="w-full">
                        Subscribe
                      </GlowButton>
                    </div>
                  )}
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
