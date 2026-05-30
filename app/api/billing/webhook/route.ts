import { createHash } from "node:crypto";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { trackEvent } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import { billingEvents, subscriptions, users } from "@/lib/db/schema";
import { tierForVariantId, type BillingTier } from "@/lib/billing/lemonsqueezy";
import { verifyWebhookSignature } from "@/lib/billing/webhook-signature";
import { normalizeUuid } from "@/lib/ids";

export const runtime = "nodejs";

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    webhook_id?: string;
    custom_data?: {
      userId?: string;
      tier?: string;
    };
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      customer_id?: number | string | null;
      variant_id?: number | string | null;
      status?: string | null;
      renews_at?: string | null;
      ends_at?: string | null;
      user_email?: string | null;
    };
  };
}

const ACTIVE_STATUSES = new Set(["active", "on_trial", "paid"]);
const INACTIVE_STATUSES = new Set([
  "cancelled",
  "expired",
  "past_due",
  "paused",
  "unpaid",
]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 503 },
    );
  }

  if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name ?? "unknown";
  const dedupeKey =
    payload.meta?.webhook_id ??
    `${eventName}:${createHash("sha256").update(rawBody).digest("hex")}`;

  const [event] = await getDb()
    .insert(billingEvents)
    .values({
      eventName,
      dedupeKey,
      payload,
    })
    .onConflictDoNothing({ target: billingEvents.dedupeKey })
    .returning({ id: billingEvents.id });

  const eventId = event?.id;
  let eventToMarkProcessed = eventId;

  if (!eventToMarkProcessed) {
    const [existingEvent] = await getDb()
      .select({
        id: billingEvents.id,
        processedAt: billingEvents.processedAt,
      })
      .from(billingEvents)
      .where(eq(billingEvents.dedupeKey, dedupeKey))
      .limit(1);

    if (existingEvent?.processedAt) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    if (!existingEvent) {
      return NextResponse.json({ error: "Unable to load event" }, { status: 500 });
    }

    eventToMarkProcessed = existingEvent.id;
  }

  if (eventName.startsWith("subscription_")) {
    await handleSubscriptionEvent(payload);
  }

  await getDb()
    .update(billingEvents)
    .set({ processedAt: new Date() })
    .where(eq(billingEvents.id, eventToMarkProcessed));

  return NextResponse.json({ ok: true });
}

async function handleSubscriptionEvent(payload: LemonWebhookPayload) {
  const subscriptionId = payload.data?.id;
  const attributes = payload.data?.attributes;
  const status = attributes?.status ?? "unknown";
  const variantId = attributes?.variant_id?.toString();
  const mappedTier = variantId ? tierForVariantId(variantId) : null;
  const customTier = toBillingTier(payload.meta?.custom_data?.tier);
  const tier = mappedTier ?? customTier ?? "educator";
  const userId = normalizeUuid(payload.meta?.custom_data?.userId);

  if (!subscriptionId || !userId) {
    return;
  }

  const active = ACTIVE_STATUSES.has(status);
  const inactive = INACTIVE_STATUSES.has(status);

  await getDb()
    .insert(subscriptions)
    .values({
      userId,
      lemonSubscriptionId: subscriptionId,
      lemonCustomerId: attributes?.customer_id?.toString() ?? null,
      lemonVariantId: variantId ?? null,
      plan: tier,
      status,
      renewsAt: parseDate(attributes?.renews_at),
      endsAt: parseDate(attributes?.ends_at),
    })
    .onConflictDoUpdate({
      target: subscriptions.lemonSubscriptionId,
      set: {
        lemonCustomerId: attributes?.customer_id?.toString() ?? null,
        lemonVariantId: variantId ?? null,
        plan: tier,
        status,
        renewsAt: parseDate(attributes?.renews_at),
        endsAt: parseDate(attributes?.ends_at),
        updatedAt: new Date(),
      },
    });

  if (active || inactive) {
    await getDb()
      .update(users)
      .set({
        plan: active ? tier : "unpaid",
        status: "active",
      })
      .where(eq(users.id, userId));

    try {
      await trackEvent({
        distinctId: userId,
        event: active ? "subscription_activated" : "subscription_cancelled",
        properties: { plan: active ? tier : "unpaid", status },
      });
    } catch {
      /* swallow */
    }
  }
}

function parseDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function toBillingTier(value: string | undefined): BillingTier | null {
  return value === "educator" || value === "department" ? value : null;
}
