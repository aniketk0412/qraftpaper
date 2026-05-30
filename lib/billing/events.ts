/**
 * Turns a raw Lemon Squeezy webhook event name (subscription_payment_success,
 * subscription_cancelled, ...) into something a human can read in the billing
 * history, plus a tone the UI maps to a colour + icon.
 *
 * Pure + exhaustively defaulted so an event type we haven't mapped yet still
 * renders a sensible humanised label instead of a raw snake_case string.
 */
export type BillingEventTone = "accent" | "gold" | "violet" | "neutral";

export interface BillingEventDescriptor {
  label: string;
  tone: BillingEventTone;
}

const MAP: Record<string, BillingEventDescriptor> = {
  subscription_created: { label: "Subscription started", tone: "accent" },
  subscription_payment_success: { label: "Payment received", tone: "accent" },
  subscription_payment_recovered: { label: "Payment recovered", tone: "accent" },
  subscription_resumed: { label: "Subscription resumed", tone: "accent" },
  subscription_unpaused: { label: "Subscription resumed", tone: "accent" },
  subscription_updated: { label: "Subscription updated", tone: "violet" },
  subscription_plan_changed: { label: "Plan changed", tone: "violet" },
  subscription_paused: { label: "Subscription paused", tone: "neutral" },
  subscription_expired: { label: "Subscription expired", tone: "neutral" },
  subscription_cancelled: { label: "Subscription cancelled", tone: "gold" },
  subscription_payment_failed: { label: "Payment failed", tone: "gold" },
  order_created: { label: "Order placed", tone: "accent" },
  order_refunded: { label: "Order refunded", tone: "gold" },
};

export function describeBillingEvent(eventName: string): BillingEventDescriptor {
  return MAP[eventName] ?? { label: humanizeEventName(eventName), tone: "neutral" };
}

/** "subscription_payment_success" -> "Subscription payment success". */
export function humanizeEventName(eventName: string): string {
  const cleaned = eventName.replace(/[_-]+/g, " ").trim();
  if (!cleaned) return "Billing event";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
