import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The single, unmistakable way to show an error in a form or after an action.
 * Red border + tint + text + a warning glyph, and role="alert" so screen
 * readers announce it. Use this anywhere a request can fail — never a neutral
 * grey box, which reads as ordinary status text.
 */
export function FormError({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-danger/35 bg-danger/[0.08] px-4 py-3 text-[0.8rem] leading-relaxed text-danger",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0">{children}</span>
    </div>
  );
}
