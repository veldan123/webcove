import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { editPage } from "@/lib/anthropic";
import type { PageContent, PageRow } from "@/lib/types";

export const maxDuration = 60;

const bodySchema = z.object({
  pageId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { pageId, message } = parsed.data;

  const supabase = await createClient();

  // Verify the site belongs to the user (RLS also lets users read published
  // sites, so we can't rely on the read succeeding — check ownership).
  const { data: site } = await supabase
    .from("sites")
    .select("id, owner_id")
    .eq("id", siteId)
    .single<{ id: string; owner_id: string }>();
  if (!site || site.owner_id !== session.userId) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("id", pageId)
    .eq("site_id", siteId)
    .single<PageRow>();
  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  let updated: PageContent;
  try {
    updated = await editPage({
      instruction: message,
      currentContent: page.content,
    });
  } catch (err) {
    console.error("Edit chat failed:", err);
    return NextResponse.json(
      { error: "The AI couldn't apply that change. Try rephrasing." },
      { status: 502 }
    );
  }

  const { error: updateError } = await supabase
    .from("pages")
    .update({ content: updated })
    .eq("id", pageId);
  if (updateError) {
    console.error("Failed to save page edit:", updateError);
    return NextResponse.json(
      { error: "Could not save the change." },
      { status: 500 }
    );
  }

  return NextResponse.json({ content: updated });
}
