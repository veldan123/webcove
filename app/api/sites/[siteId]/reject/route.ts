import { NextResponse } from "next/server";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SiteRow } from "@/lib/types";

/**
 * Records that the client turned this sample down. The 48-hour sample still
 * runs out on its own, and the publish it consumed is NOT refunded — a rejected
 * sample still counts toward the monthly publish quota.
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
  if (site.kept) {
    return NextResponse.json(
      { error: "This site was already approved and kept." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("sites")
    .update({ rejected: true })
    .eq("id", siteId);

  if (error) {
    console.error("reject failed:", error);
    return NextResponse.json(
      { error: "Could not save that." },
      { status: 500 }
    );
  }

  return NextResponse.json({ rejected: true });
}
