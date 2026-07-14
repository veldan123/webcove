import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/auth";
import { getPortalUrl } from "@/lib/lemonsqueezy";

// Opens the Lemon Squeezy customer portal (manage/cancel subscription).
export async function POST() {
  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  // The Lemon Squeezy subscription id is stored in stripe_subscription_id.
  const subId = session.profile.stripe_subscription_id;
  if (!subId) {
    return NextResponse.json(
      { error: "No subscription yet. Subscribe to a plan first." },
      { status: 400 }
    );
  }

  const url = await getPortalUrl(subId);
  if (!url) {
    return NextResponse.json(
      { error: "Could not open the billing portal." },
      { status: 502 }
    );
  }
  return NextResponse.json({ url });
}
