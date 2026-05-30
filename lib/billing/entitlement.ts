/**
 * The grant/revoke decision at the heart of billing: given a Lemon Squeezy
 * subscription status and the plan it maps to, what should the user's
 * entitlement (`users.plan`) become — and should we touch it at all?
 *
 * Extracted from the webhook route so the single most consequential branch in
 * the money path is unit-tested. The one property that really matters and was
 * never verified: an UNKNOWN status (anything Lemon Squeezy adds in future, or
 * a typo, or an event type we don't model) must leave the user's plan
 * UNTOUCHED — `shouldUpdate: false`. Without that guard a novel status could
 * silently revoke a paying customer.
 */

/** Statuses that mean "this person is entitled to their paid plan." */
export const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "on_trial",
  "paid",
]);

/** Statuses that mean "revoke — drop them to unpaid." */
export const INACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "cancelled",
  "expired",
  "past_due",
  "paused",
  "unpaid",
]);

export interface EntitlementDecision {
  /** Whether the user's plan column should be written at all. */
  shouldUpdate: boolean;
  /** The plan to set when shouldUpdate is true. */
  plan: string;
  /** True when this decision is granting paid access (vs revoking). */
  granting: boolean;
}

export function resolveEntitlement(
  status: string,
  tier: string,
): EntitlementDecision {
  if (ACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
    return { shouldUpdate: true, plan: tier, granting: true };
  }
  if (INACTIVE_SUBSCRIPTION_STATUSES.has(status)) {
    return { shouldUpdate: true, plan: "unpaid", granting: false };
  }
  // Unknown status — do not touch the user's entitlement.
  return { shouldUpdate: false, plan: "unpaid", granting: false };
}
