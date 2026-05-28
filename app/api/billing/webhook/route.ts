import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { billingEvents, subscriptions, users } from "@/lib/db/schema";
import { tierForVariantId, type BillingTier } from "@/lib/billing/lemonsqueezy";
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

  if (!signature || !verifySignature(rawBody, signature, secret)) {
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
      processedAt: new Date(),
    })
    .onConflictDoNothing({ target: billingEvents.dedupeKey })
    .returning({ id: billingEvents.id });

  if (!event) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  if (eventName.startsWith("subscription_")) {
    await handleSubscriptionEvent(payload);
  }

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
  }
}

function verifySignature(rawBody: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function parseDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function toBillingTier(value: string | undefined): BillingTier | null {
  return value === "educator" || value === "department" ? value : null;
}
