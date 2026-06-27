import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  Receipt,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import {
  describeBillingEvent,
  type BillingEventTone,
} from "@/lib/billing/events";
import { cn } from "@/lib/utils";

export interface BillingHistoryItem {
  eventName: string;
  createdAt: Date | null;
}

const toneStyles: Record<
  BillingEventTone,
  { ring: string; bg: string; text: string; icon: LucideIcon }
> = {
  accent: {
    ring: "ring-accent/30",
    bg: "bg-accent/15",
    text: "text-accent",
    icon: CheckCircle2,
  },
  violet: {
    ring: "ring-violet/30",
    bg: "bg-violet/15",
    text: "text-violet-bright",
    icon: RefreshCw,
  },
  gold: {
    ring: "ring-gold/30",
    bg: "bg-gold/15",
    text: "text-gold",
    icon: AlertTriangle,
  },
  neutral: {
    ring: "ring-line",
    bg: "bg-tint/[0.05]",
    text: "text-fg-muted",
    icon: Clock,
  },
};

function formatWhen(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Vertical billing-event timeline. Reads from the same billing_events ledger
 * the webhook writes — each row is one event Lemon Squeezy sent us, so it
 * doubles as the customer-facing receipt log and the proof of what happened.
 *
 * Empty state is friendly rather than blank: a brand-new / never-subscribed
 * account just hasn't generated any events yet.
 */
export function BillingHistory({ items }: { items: BillingHistoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-none border border-dashed border-line-strong bg-transparent px-4 py-5">
        <Receipt className="h-4 w-4 shrink-0 text-fg-subtle" />
        <p className="text-[0.84rem] text-fg-muted">
          No billing events yet. Once you subscribe, every payment, renewal and
          change shows up here.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative flex flex-col">
      {items.map((item, i) => {
        const { label, tone } = describeBillingEvent(item.eventName);
        const style = toneStyles[tone];
        const Icon = pickIcon(item.eventName, style.icon);
        const isLast = i === items.length - 1;
        return (
          <li key={`${item.eventName}-${i}`} className="relative flex gap-3.5 pb-5 last:pb-0">
            {/* Connecting rail between dots */}
            {!isLast && (
              <span
                aria-hidden
                className="absolute left-[17px] top-9 h-[calc(100%-1.25rem)] w-px bg-line"
              />
            )}
            <span
              className={cn(
                "relative grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1",
                style.bg,
                style.ring,
                style.text,
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[0.88rem] font-medium leading-snug">{label}</p>
              <p className="mt-0.5 font-mono text-[0.66rem] uppercase tracking-[0.12em] text-fg-subtle">
                {formatWhen(item.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Payment-flavoured events get a card icon regardless of tone, so the money
 *  moments stand out from plan-state changes. */
function pickIcon(eventName: string, fallback: LucideIcon): LucideIcon {
  if (eventName.includes("payment") || eventName.includes("order")) {
    return CreditCard;
  }
  return fallback;
}
