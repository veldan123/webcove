import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStripe, ensureStripeCustomer } from "@/lib/stripe";
import { BRANDING_REMOVAL_PRICE_USD } from "@/lib/site-status";
import type { SiteRow } from "@/lib/types";

function baseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

/**
 * One-time Stripe payment to remove the "Built with Webcove" badge from a site.
 * On success the webhook sets branding_removed = true.
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

  if (site.branding_removed) {
    return NextResponse.json({ alreadyRemoved: true });
  }

  try {
    const stripe = getStripe();
    const customerId = await ensureStripeCustomer(session.profile, session.email);

    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      client_reference_id: session.userId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(BRANDING_REMOVAL_PRICE_USD * 100),
            product_data: {
              name: `Remove "Built with Webcove" badge`,
              description: `One-time fee to hide the Webcove badge on "${site.business_name}".`,
            },
          },
        },
      ],
      metadata: { kind: "remove_branding", userId: session.userId, siteId },
      payment_intent_data: {
        metadata: { kind: "remove_branding", userId: session.userId, siteId },
      },
      success_url: `${baseUrl()}/dashboard/${siteId}?branding=removed`,
      cancel_url: `${baseUrl()}/dashboard/${siteId}`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("Remove-branding checkout failed:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
