import "server-only";
import Stripe from "stripe";
import { createAdminClient } from "./supabase/admin";
import type { Plan, SubscriptionStatus } from "./plans";
import type { ProfileRow } from "./types";

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

/**
 * Returns a VALID Stripe customer id for this user, creating one if needed.
 * A stored id can be stale — e.g. left over from a test-mode session, so it
 * doesn't exist in live mode. We verify it and recreate if it's missing or
 * deleted, persisting the fresh id. This prevents checkout from crashing with
 * "No such customer".
 */
export async function ensureStripeCustomer(
  profile: ProfileRow,
  email: string | undefined
): Promise<string> {
  const stripe = getStripe();
  const admin = createAdminClient();

  const existing = profile.stripe_customer_id;
  if (existing) {
    try {
      const c = await stripe.customers.retrieve(existing);
      if (!(c as Stripe.DeletedCustomer).deleted) return existing;
    } catch {
      // Falls through to recreate — the stored id is invalid for this mode.
    }
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId: profile.id },
  });
  await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", profile.id);
  return customer.id;
}

// Maps our paid plans to their configured Stripe Price IDs.
export function priceIdForPlan(plan: Exclude<Plan, "none">): string {
  const map: Record<Exclude<Plan, "none">, string | undefined> = {
    basic: process.env.STRIPE_PRICE_BASIC,
    pro: process.env.STRIPE_PRICE_PRO,
    agency: process.env.STRIPE_PRICE_AGENCY,
  };
  const priceId = map[plan];
  if (!priceId) throw new Error(`No Stripe price configured for plan "${plan}"`);
  return priceId;
}

// Reverse lookup used by the webhook to derive the plan from a subscription's price.
export function planForPriceId(priceId: string | undefined | null): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_BASIC) return "basic";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return "agency";
  return null;
}

// Maps Stripe's subscription status to our internal enum.
export function mapStripeStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "inactive";
  }
}

// The active price id on a subscription (first item).
export function priceIdOfSubscription(
  sub: Stripe.Subscription
): string | undefined {
  return sub.items.data[0]?.price?.id;
}

/**
 * Current period end as an ISO string. In recent Stripe API versions this field
 * moved from the subscription root onto each subscription item, so read from the
 * item first and fall back to the (deprecated) root field.
 */
export function subscriptionPeriodEnd(
  sub: Stripe.Subscription
): string | null {
  const item = sub.items.data[0] as { current_period_end?: number } | undefined;
  const rootEnd = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const unix = item?.current_period_end ?? rootEnd;
  return unix ? new Date(unix * 1000).toISOString() : null;
}
