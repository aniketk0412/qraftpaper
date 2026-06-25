import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  createBillingCheckout,
  isBillingConfigured,
  isBillingTier,
} from "@/lib/billing/lemonsqueezy";
import { isTrialEligible } from "@/lib/billing/trial";
import { captureException } from "@/lib/observability";

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

  // One-time eligibility for the $1 3-Day Pass: never consumed before, and not
  // already on a real plan. Stops a user buying a second pass or downgrading.
  if (body.tier === "trial" && !(await isTrialEligible(session.user.id))) {
    return NextResponse.json(
      { error: "The 3-Day Pass is one per account. Upgrade to Solo instead." },
      { status: 409 },
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
    captureException(error, { scope: "billing:checkout", userId: session.user.id });
    return NextResponse.json(
      { error: "Unable to start checkout right now. Please try again shortly." },
      { status: 502 },
    );
  }
}
