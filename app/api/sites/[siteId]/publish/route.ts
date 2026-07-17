import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@/lib/plans";
import { isSiteLive, SAMPLE_MS } from "@/lib/site-status";
import type { SiteRow } from "@/lib/types";

/**
 * Server-side publish with full quota enforcement. This is the REAL gate —
 * the client Publish button is only a hint. Steps follow the spec exactly:
 *   1. Require an active subscription (else signal redirect-to-checkout).
 *   2. Look up the plan's limits.
 *   3. Basic/Pro: reject if already at maxPublishedSites.
 *   4. Agency: reject if at monthlyPublishQuota, else atomically increment.
 *   5. Only then set published = true, published_at = now().
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
  const { profile, userId } = session;

  // Load the site (RLS limits to owned/published rows); verify ownership.
  const supabase = await createClient();
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .single<SiteRow>();

  if (!site || site.owner_id !== userId) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  // Already live — idempotent success, doesn't consume quota again. An Agency
  // sample whose 48h window has elapsed is NOT live, so it can be re-published
  // (which counts as a new sample publish).
  if (isSiteLive(site)) {
    return NextResponse.json({ published: true });
  }

  // 1. Must have an active subscription.
  if (profile.subscription_status !== "active" || profile.plan === "none") {
    return NextResponse.json(
      {
        error: "An active subscription is required to publish.",
        redirectToCheckout: true,
      },
      { status: 402 }
    );
  }

  // 2. Plan limits.
  const limits = PLAN_LIMITS[profile.plan];

  // Defense-in-depth: enforce the page cap at publish time too.
  const { count: pageCount } = await supabase
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId);
  if ((pageCount ?? 0) > limits.maxPagesPerSite) {
    return NextResponse.json(
      {
        error: `This site has ${pageCount} pages but your ${profile.plan} plan allows ${limits.maxPagesPerSite}. Remove pages or upgrade.`,
      },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // 3. Basic/Pro: cap concurrently-published sites.
  if (limits.maxPublishedSites !== null) {
    const { count: publishedCount } = await supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId)
      .eq("published", true);

    if ((publishedCount ?? 0) >= limits.maxPublishedSites) {
      return NextResponse.json(
        {
          error: `Your ${profile.plan} plan allows ${limits.maxPublishedSites} published site. Unpublish another site or upgrade to publish this one.`,
        },
        { status: 403 }
      );
    }
  }

  // 4. Agency: atomically check + increment the monthly publish quota.
  if (limits.monthlyPublishQuota !== null) {
    const { data: allowed, error: rpcError } = await admin.rpc(
      "increment_publish_quota",
      { p_user: userId, p_max: limits.monthlyPublishQuota }
    );
    if (rpcError) {
      console.error("increment_publish_quota failed:", rpcError);
      return NextResponse.json(
        { error: "Could not check your publish quota." },
        { status: 500 }
      );
    }
    if (!allowed) {
      return NextResponse.json(
        {
          error: `You've used all ${limits.monthlyPublishQuota} publishes for this billing period. It resets at your next renewal.`,
        },
        { status: 403 }
      );
    }
  }

  // 5. All checks passed — publish.
  // Agency publishes are 48-hour SAMPLES that come down automatically (unless
  // already kept). Basic/Pro publish permanently (no expiry).
  const now = Date.now();
  const isAgencySample = profile.plan === "agency" && !site.kept;
  const { error: publishError } = await admin
    .from("sites")
    .update({
      published: true,
      published_at: new Date(now).toISOString(),
      publish_expires_at: isAgencySample
        ? new Date(now + SAMPLE_MS).toISOString()
        : null,
    })
    .eq("id", siteId);

  if (publishError) {
    console.error("Publish update failed:", publishError);
    // Best-effort refund of the Agency counter if the publish write failed.
    if (limits.monthlyPublishQuota !== null) {
      await admin
        .from("profiles")
        .update({
          publishes_this_period: Math.max(0, profile.publishes_this_period),
        })
        .eq("id", userId);
    }
    return NextResponse.json(
      { error: "Could not publish the site." },
      { status: 500 }
    );
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/${site.slug}`;
  return NextResponse.json({
    published: true,
    url: publicUrl,
    publishExpiresAt: isAgencySample
      ? new Date(now + SAMPLE_MS).toISOString()
      : null,
  });
}
