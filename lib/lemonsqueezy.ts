import "server-only";
import crypto from "crypto";
import type { Plan, SubscriptionStatus } from "./plans";

// Lemon Squeezy acts as Merchant of Record — no company/ACRA needed. This
// replaces the Stripe integration for checkout, webhooks, and the customer
// portal. Plan gating elsewhere reads profiles.subscription_status/plan, which
// are provider-agnostic, so nothing else changes.

const API = "https://api.lemonsqueezy.com/v1";

function apiKey(): string {
  const k = process.env.LEMONSQUEEZY_API_KEY;
  if (!k) throw new Error("LEMONSQUEEZY_API_KEY is not set");
  return k;
}

async function ls(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey()}`,
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ---- Plan ⇄ variant mapping ----
export function variantIdForPlan(plan: Exclude<Plan, "none">): string {
  const map: Record<Exclude<Plan, "none">, string | undefined> = {
    basic: process.env.LEMONSQUEEZY_VARIANT_BASIC,
    pro: process.env.LEMONSQUEEZY_VARIANT_PRO,
    agency: process.env.LEMONSQUEEZY_VARIANT_AGENCY,
  };
  const v = map[plan];
  if (!v) throw new Error(`No Lemon Squeezy variant configured for "${plan}"`);
  return v;
}

export function planForVariant(variantId: string | number | null): Plan | null {
  const v = String(variantId ?? "");
  if (v === process.env.LEMONSQUEEZY_VARIANT_BASIC) return "basic";
  if (v === process.env.LEMONSQUEEZY_VARIANT_PRO) return "pro";
  if (v === process.env.LEMONSQUEEZY_VARIANT_AGENCY) return "agency";
  return null;
}

// Lemon Squeezy subscription status → our enum.
export function mapLsStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "active":
    case "on_trial":
    case "cancelled": // still active until the period ends
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "expired":
    case "paused":
      return "inactive";
    default:
      return "inactive";
  }
}

/** Creates a hosted checkout for a plan and returns its URL. */
export async function createCheckout(input: {
  plan: Exclude<Plan, "none">;
  email?: string;
  userId: string;
  redirectUrl: string;
}): Promise<string> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) throw new Error("LEMONSQUEEZY_STORE_ID is not set");

  const { ok, data } = await ls("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: input.email,
            custom: { user_id: input.userId },
          },
          product_options: {
            redirect_url: input.redirectUrl,
            enabled_variants: [Number(variantIdForPlan(input.plan))],
          },
        },
        relationships: {
          store: { data: { type: "stores", id: String(storeId) } },
          variant: {
            data: { type: "variants", id: variantIdForPlan(input.plan) },
          },
        },
      },
    }),
  });
  if (!ok || !data?.data?.attributes?.url) {
    throw new Error(
      data?.errors?.[0]?.detail || "Failed to create Lemon Squeezy checkout"
    );
  }
  return data.data.attributes.url as string;
}

/** Returns the customer-portal URL for a subscription (manage/cancel). */
export async function getPortalUrl(subscriptionId: string): Promise<string | null> {
  const { ok, data } = await ls(`/subscriptions/${subscriptionId}`);
  if (!ok) return null;
  return data?.data?.attributes?.urls?.customer_portal ?? null;
}

/** Verifies the X-Signature webhook header against the raw body. */
export function verifyWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(digest);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
