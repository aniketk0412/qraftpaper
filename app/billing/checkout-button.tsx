"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

import { GlowButton } from "@/components/ui/glow-button";
import { FormError } from "@/components/ui/form-error";
import type { BillingTier } from "@/lib/billing/lemonsqueezy";

export function CheckoutButton({
  tier,
  children,
}: {
  tier: BillingTier;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error ?? "Unable to start checkout.");
      }

      window.location.href = payload.checkoutUrl;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <GlowButton
        type="button"
        size="md"
        className="w-full"
        disabled={loading}
        onClick={startCheckout}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
        {!loading && <ArrowRight className="h-4 w-4" />}
      </GlowButton>
      {error && <FormError className="text-[0.76rem]">{error}</FormError>}
    </div>
  );
}
