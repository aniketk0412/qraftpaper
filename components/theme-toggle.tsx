"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const isDark = document.documentElement.dataset.theme === "dark";
    const next = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("qp-theme", next);
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle colour theme"
      title="Toggle light / dark"
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full glass text-fg-muted transition-colors hover:text-fg",
        className,
      )}
    >
      {/* Icon shows the current theme; visibility is driven by the data-theme attribute */}
      <Moon className="h-[18px] w-[18px] dark:hidden" />
      <Sun className="hidden h-[18px] w-[18px] dark:block" />
    </button>
  );
}
