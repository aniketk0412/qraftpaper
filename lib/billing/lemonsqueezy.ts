import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

import { PLANS } from "@/lib/plans";

export type BillingTier = "educator" | "department";

export interface BillingTierInfo {
  tier: BillingTier;
  label: string;
  /** Bare price like "$7" — rendered large alongside `period`. */
  price: string;
  /** Period suffix like "/ month" — rendered small next to `price`. */
  period: string;
  blurb: string;
  generationCap: string;
}

// Derive every label from PLANS so the billing page can never drift from the
// public pricing section or the enforced plan limits. If you change a price
// or allowance, update lib/plans.ts — nothing else needs to know. Price and
// period are kept SEPARATE so the billing card can render them with the same
// baseline-split treatment the marketing pricing card uses.
function fromPlan(tier: BillingTier): BillingTierInfo {
  const plan = PLANS[tier];
  return {
    tier,
    label: plan.name,
    price: plan.price,
    period: plan.period,
    blurb: plan.tagline,
    generationCap:
      plan.generationsPerMonth === null
        ? "Custom monthly allowance"
        : `${plan.generationsPerMonth} generations / month`,
  };
}

export const billingTiers: Record<BillingTier, BillingTierInfo> = {
  educator: fromPlan("educator"),
  department: fromPlan("department"),
};

/** True only when every Lemon Squeezy secret needed at runtime is present. */
export function isBillingConfigured(): boolean {
  return Boolean(
    process.env.LEMONSQUEEZY_API_KEY &&
      process.env.LEMONSQUEEZY_STORE_ID &&
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET &&
      process.env.LEMONSQUEEZY_VARIANT_EDUCATOR &&
      process.env.LEMONSQUEEZY_VARIANT_DEPARTMENT,
  );
}

let initialised = false;

/** Lazily configure the SDK; throws if billing is not configured. */
export function ensureLemonSqueezy(): void {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error("Billing is not configured");
  }
  if (!initialised) {
    lemonSqueezySetup({ apiKey });
    initialised = true;
  }
}

export function getStoreId(): string {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) {
    throw new Error("Billing is not configured");
  }
  return storeId;
}

export function variantIdForTier(tier: BillingTier): string | undefined {
  if (tier === "educator") return process.env.LEMONSQUEEZY_VARIANT_EDUCATOR;
  if (tier === "department") return process.env.LEMONSQUEEZY_VARIANT_DEPARTMENT;
  return undefined;
}

export function tierForVariantId(variantId: string): BillingTier | null {
  if (variantId && variantId === process.env.LEMONSQUEEZY_VARIANT_EDUCATOR) {
    return "educator";
  }
  if (variantId && variantId === process.env.LEMONSQUEEZY_VARIANT_DEPARTMENT) {
    return "department";
  }
  return null;
}

export function isBillingTier(value: unknown): value is BillingTier {
  return value === "educator" || value === "department";
}

export async function createBillingCheckout({
  tier,
  userId,
  email,
  name,
  origin,
}: {
  tier: BillingTier;
  userId: string;
  email: string;
  name?: string | null;
  origin: string;
}) {
  ensureLemonSqueezy();

  const storeId = getStoreId();
  const variantId = variantIdForTier(tier);

  if (!variantId) {
    throw new Error(`Missing Lemon Squeezy variant id for ${tier}`);
  }

  const checkout = await createCheckout(storeId, variantId, {
    checkoutOptions: {
      embed: false,
      media: false,
      logo: false,
      discount: true,
      backgroundColor: "#e8ecf0",
      headingsColor: "#1a2332",
      primaryTextColor: "#1a2332",
      secondaryTextColor: "#4a5f6f",
      linksColor: "#2d8b8b",
      bordersColor: "#cdddd9",
      buttonColor: "#2d8b8b",
      buttonTextColor: "#ffffff",
    },
    checkoutData: {
      email,
      name: name ?? undefined,
      custom: {
        userId,
        tier,
      },
    },
    productOptions: {
      redirectUrl: `${origin}/billing?checkout=success`,
      receiptButtonText: "Open QraftPaper",
      receiptLinkUrl: `${origin}/dashboard`,
      receiptThankYouNote:
        "Your QraftPaper workspace will update as soon as the payment webhook is confirmed.",
    },
  });

  if (checkout.error || !checkout.data?.data.attributes.url) {
    throw new Error(checkout.error?.message ?? "Unable to create checkout");
  }

  return checkout.data.data.attributes.url;
}
