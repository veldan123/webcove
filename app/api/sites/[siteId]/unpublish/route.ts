import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { SiteRow } from "@/lib/types";

/**
 * Takes a site offline. For Basic/Pro this frees their one published-site slot.
 * Note: it does NOT refund an Agency monthly publish — that quota is metered per
 * publish action, not by concurrent count.
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

  const { error } = await supabase
    .from("sites")
    .update({ published: false, published_at: null })
    .eq("id", siteId);

  if (error) {
    console.error("Unpublish failed:", error);
    return NextResponse.json(
      { error: "Could not unpublish the site." },
      { status: 500 }
    );
  }

  return NextResponse.json({ published: false });
}
