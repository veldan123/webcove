import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { KEEP_SITE_PRICE_USD } from "@/lib/site-status";
import type { SiteRow } from "@/lib/types";

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

/**
 * Starts a ONE-TIME Stripe payment to keep an approved Agency sample live
 * permanently. On success the webhook flips the site to kept = true and clears
 * its 48-hour expiry. This is the "Approved website" action.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .single<SiteRow>();

  if (!site || site.owner_id !== session.userId) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  if (session.profile.plan !== "agency") {
    return NextResponse.json(
      { error: "Keeping an approved site is an Agency feature." },
      { status: 403 }
    );
  }

  if (site.kept) {
    return NextResponse.json({ alreadyKept: true });
  }

  const stripe = getStripe();

  // Reuse the Agency customer if one exists so the payment lands on their record.
  const customerId = session.profile.stripe_customer_id ?? undefined;

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    ...(customerId ? { customer: customerId } : { customer_email: session.email }),
    client_reference_id: session.userId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: KEEP_SITE_PRICE_USD * 100,
          product_data: {
            name: `Keep "${site.business_name}" live permanently`,
            description:
              "One-time fee to publish this approved website for your client without the 48-hour limit.",
          },
        },
      },
    ],
    metadata: { kind: "keep_site", userId: session.userId, siteId },
    payment_intent_data: {
      metadata: { kind: "keep_site", userId: session.userId, siteId },
    },
    success_url: `${baseUrl()}/dashboard/${siteId}?kept=success`,
    cancel_url: `${baseUrl()}/dashboard/${siteId}`,
  });

  return NextResponse.json({ url: checkout.url });
}
