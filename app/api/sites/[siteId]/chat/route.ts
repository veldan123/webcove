import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { chatEdit } from "@/lib/anthropic";
import type { PageRow } from "@/lib/types";

export const maxDuration = 60;

const bodySchema = z.object({
  pageId: z.string().uuid(),
  message: z
    .string()
    .min(1)
    .max(12000, "That message is very long — please shorten it a bit."),
  imageUrl: z.string().url().optional(),
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 }
    );
  }
  const { pageId, message, imageUrl } = parsed.data;

  const supabase = await createClient();

  // Verify the site belongs to the user (RLS also lets users read published
  // sites, so we can't rely on the read succeeding — check ownership).
  const { data: site } = await supabase
    .from("sites")
    .select("id, owner_id, generated_content")
    .eq("id", siteId)
    .single<{
      id: string;
      owner_id: string;
      generated_content: { theme?: Record<string, unknown> } | null;
    }>();
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

  let result: Awaited<ReturnType<typeof chatEdit>>;
  try {
    result = await chatEdit({
      instruction: message,
      currentContent: page.content,
      imageUrl,
    });
  } catch (err) {
    console.error("Chat failed:", err);
    return NextResponse.json(
      { error: "The AI had trouble with that. Try rephrasing." },
      { status: 502 }
    );
  }

  // Persist page content changes.
  if (result.content) {
    const { error: updateError } = await supabase
      .from("pages")
      .update({ content: result.content })
      .eq("id", pageId);
    if (updateError) {
      console.error("Failed to save page edit:", updateError);
      return NextResponse.json(
        { error: "Could not save the change." },
        { status: 500 }
      );
    }
  }

  // Persist site-wide theme changes (logo, colors, template).
  let updatedTheme: Record<string, unknown> | null = null;
  if (result.themePatch && Object.keys(result.themePatch).length > 0) {
    const gc = site.generated_content ?? {};
    updatedTheme = { ...(gc.theme ?? {}), ...result.themePatch };
    const { error: themeError } = await supabase
      .from("sites")
      .update({ generated_content: { ...gc, theme: updatedTheme } })
      .eq("id", siteId);
    if (themeError) {
      console.error("Failed to save theme change:", themeError);
      return NextResponse.json(
        { error: "Could not save the style change." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    reply: result.reply,
    content: result.content,
    theme: updatedTheme,
  });
}
