import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * In-app back affordance for dashboard sub-pages. iOS standalone / PWA mode
 * has no browser back control, so every sub-page needs a visible one.
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
      className="mb-5 inline-flex items-center gap-1.5 rounded-full glass px-3.5 py-2 text-[0.8rem] text-fg-muted transition-colors hover:text-fg"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
