import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  getStripe,
  mapStripeStatus,
  planForPriceId,
  priceIdOfSubscription,
  subscriptionPeriodEnd,
} from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Plan, SubscriptionStatus } from "@/lib/plans";

// Stripe requires the raw request body to verify the signature.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    // Do NOT process unverified events.
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  type ProfilePatch = {
    plan?: Plan;
    subscription_status?: SubscriptionStatus;
    stripe_customer_id?: string;
    stripe_subscription_id?: string | null;
    current_period_end?: string | null;
    publishes_this_period?: number;
  };

  async function patchByCustomer(customerId: string, patch: ProfilePatch) {
    const { error } = await admin
      .from("profiles")
      .update(patch)
      .eq("stripe_customer_id", customerId);
    if (error) console.error("profile patch (by customer) failed:", error);
  }

  async function patchById(userId: string, patch: ProfilePatch) {
    const { error } = await admin.from("profiles").update(patch).eq("id", userId);
    if (error) console.error("profile patch (by id) failed:", error);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId =
          s.client_reference_id || (s.metadata?.userId as string | undefined);
        const customerId = s.customer as string;
        const subscriptionId = s.subscription as string | null;

        // Retrieve the subscription for the authoritative plan + status.
        let plan: Plan | null = (s.metadata?.plan as Plan) || null;
        let status: SubscriptionStatus = "active";
        let periodEnd: string | null = null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          plan = planForPriceId(priceIdOfSubscription(sub)) ?? plan;
          status = mapStripeStatus(sub.status);
          periodEnd = subscriptionPeriodEnd(sub);
        }

        const patch: ProfilePatch = {
          plan: plan ?? "none",
          subscription_status: status,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          current_period_end: periodEnd,
        };
        if (userId) await patchById(userId, patch);
        else await patchByCustomer(customerId, patch);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const plan = planForPriceId(priceIdOfSubscription(sub));
        await patchByCustomer(sub.customer as string, {
          ...(plan ? { plan } : {}),
          subscription_status: mapStripeStatus(sub.status),
          stripe_subscription_id: sub.id,
          current_period_end: subscriptionPeriodEnd(sub),
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await patchByCustomer(sub.customer as string, {
          subscription_status: "inactive",
          plan: "none",
        });
        break;
      }

      case "invoice.paid": {
        // New billing period — reset the Agency monthly publish counter.
        const invoice = event.data.object as Stripe.Invoice;
        const periodEnd = invoice.period_end
          ? new Date(invoice.period_end * 1000).toISOString()
          : null;
        await patchByCustomer(invoice.customer as string, {
          publishes_this_period: 0,
          ...(periodEnd ? { current_period_end: periodEnd } : {}),
        });
        break;
      }

      default:
        // Unhandled event types are acknowledged but ignored.
        break;
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
