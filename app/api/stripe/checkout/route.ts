import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { getStripe, priceIdForPlan, ensureStripeCustomer } from "@/lib/stripe";

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
