"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ShareQuizButton({
  quizId,
  className,
}: {
  quizId: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}/take/${quizId}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* clipboard unavailable */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy shareable quiz link"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-full glass-strong px-4 text-[0.8rem] font-medium text-fg transition-all duration-300 hover:-translate-y-0.5 hover:bg-tint/[0.08]",
        className,
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-accent" />
      ) : (
        <Share2 className="h-3.5 w-3.5" />
      )}
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
