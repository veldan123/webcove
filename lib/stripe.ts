import "server-only";
import Stripe from "stripe";
import type { Plan, SubscriptionStatus } from "./plans";

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key);
  }
  return _stripe;
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
