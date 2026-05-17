import Link from "next/link";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="QraftPaper home"
    >
      <span className="relative grid h-9 w-9 place-items-center rounded-[0.7rem] bg-white shadow-[0_6px_22px_-9px_rgba(255,255,255,0.55)] transition-transform duration-300 group-hover:scale-105">
        <span className="absolute inset-0 rounded-[0.7rem] ring-1 ring-inset ring-black/10" />
        <Layers className="h-[17px] w-[17px] text-ink" strokeWidth={2.3} />
      </span>
      <span className="text-[1.06rem] font-semibold tracking-[-0.02em]">
        Qraft<span className="text-fg-muted">Paper</span>
      </span>
    </Link>
  );
}
