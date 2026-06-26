import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * In-app back affordance for dashboard sub-pages. iOS standalone / PWA mode
 * has no browser back control, so every sub-page needs a visible one. Styled
 * as a raw typographic mono label — no background, no padding — so it reads as
 * a margin annotation rather than a button.
 */
export function BackLink({
  href = "/dashboard",
  label = "Back to dashboard",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="group mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-fg-subtle transition-colors hover:text-fg"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
      {label}
    </Link>
  );
}
