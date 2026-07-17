import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { getStripe, priceIdForPlan, ensureStripeCustomer } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  plan: z.enum(["basic", "pro", "agency"]),
});

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

export async function POST(request: Request) {
  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const { plan } = parsed.data;

  try {
    const stripe = getStripe();
    // Always resolve to a valid live customer (recreates a stale/test-mode one).
    const customerId = await ensureStripeCustomer(session.profile, session.email);

    // Already subscribed? SWITCH the existing subscription to the new plan
    // instead of creating a second one (which would double-charge). Stripe
    // prorates the difference. The webhook + this direct patch sync the plan.
    const subId = session.profile.stripe_subscription_id;
    if (subId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subId);
        const switchable = ["active", "trialing", "past_due"].includes(
          sub.status
        );
        const item = sub.items.data[0];
        if (switchable && item && !sub.cancel_at_period_end) {
          const newPrice = priceIdForPlan(plan);
          if (item.price.id !== newPrice) {
            await stripe.subscriptions.update(subId, {
              items: [{ id: item.id, price: newPrice }],
              proration_behavior: "create_prorations",
              metadata: { userId: session.userId, plan },
            });
            const admin = createAdminClient();
            await admin
              .from("profiles")
              .update({ plan, subscription_status: "active" })
              .eq("id", session.userId);
          }
          return NextResponse.json({ switched: true });
        }
      } catch (e) {
        // Stale/invalid subscription id (e.g. left over from test mode) — fall
        // through to a fresh Checkout session below.
        console.warn("Subscription switch fell back to new checkout:", e);
      }
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: session.userId,
      line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
      subscription_data: { metadata: { userId: session.userId, plan } },
      metadata: { userId: session.userId, plan },
      success_url: `${baseUrl()}/dashboard?checkout=success`,
      cancel_url: `${baseUrl()}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
