import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  createBillingCheckout,
  isBillingConfigured,
  isBillingTier,
} from "@/lib/billing/lemonsqueezy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isBillingConfigured()) {
    return NextResponse.json(
      {
        error:
          "Billing is not configured yet. Add the Lemon Squeezy env vars to enable checkout.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { tier?: unknown };

  if (!isBillingTier(body.tier)) {
    return NextResponse.json(
      { error: "Choose a valid billing tier." },
      { status: 400 },
    );
  }

  try {
    const checkoutUrl = await createBillingCheckout({
      tier: body.tier,
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      origin: new URL(request.url).origin,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("[billing:checkout] failed to create checkout", error);
    return NextResponse.json(
      { error: "Unable to start checkout right now. Please try again shortly." },
      { status: 502 },
    );
  }
}
