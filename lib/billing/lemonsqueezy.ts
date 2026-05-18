import { createCheckout, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export type BillingTier = "educator" | "department";

export interface BillingTierInfo {
  tier: BillingTier;
  label: string;
  priceLabel: string;
  blurb: string;
  generationCap: string;
}

export const billingTiers: Record<BillingTier, BillingTierInfo> = {
  educator: {
    tier: "educator",
    label: "Educator",
    priceLabel: "$39 / month",
    blurb: "For an individual educator setting their own papers.",
    generationCap: "40 generations / month",
  },
  department: {
    tier: "department",
    label: "Department",
    priceLabel: "$249 / month",
    blurb: "For a department standardising papers across faculty.",
    generationCap: "400 generations / month",
  },
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
      backgroundColor: "#080808",
      headingsColor: "#f4f4f5",
      primaryTextColor: "#f4f4f5",
      secondaryTextColor: "#a1a1a3",
      linksColor: "#4d93ff",
      bordersColor: "#262626",
      buttonColor: "#ffffff",
      buttonTextColor: "#080808",
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
