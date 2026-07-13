import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

// Opens the Stripe Customer Portal so users can manage/cancel their subscription.
export async function POST(request: Request) {
  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!session.profile.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account yet. Subscribe to a plan first." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: session.profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/dashboard`,
  });

  return NextResponse.json({ url: portal.url });
}
