import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { getStripe, priceIdForPlan } from "@/lib/stripe";
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

  const stripe = getStripe();

  // Reuse the Stripe customer if we already created one, else create it and
  // persist the id via the service-role client (stripe_customer_id is guarded).
  let customerId = session.profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.email,
      metadata: { userId: session.userId },
    });
    customerId = customer.id;
    const admin = createAdminClient();
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", session.userId);
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
}
