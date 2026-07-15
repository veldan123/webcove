import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { generateSite } from "@/lib/anthropic";
import { getPlanLimits } from "@/lib/plans";
import { baseSlugFor } from "@/lib/slug";
import type { ContactInfo } from "@/lib/types";

export const maxDuration = 60; // generation can take a while

const bodySchema = z.object({
  businessName: z.string().min(1).max(200),
  businessType: z.string().min(1).max(200),
  businessDescription: z.string().min(1).max(10000),
  phone: z.string().max(120).optional(),
  email: z.string().max(200).optional(),
  address: z.string().max(400).optional(),
  tagline: z.string().max(400).optional(),
});

export async function POST(request: Request) {
  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const contact: ContactInfo = {
    phone: input.phone || undefined,
    email: input.email || undefined,
    address: input.address || undefined,
    tagline: input.tagline || undefined,
  };

  // Cap pages by the customer's plan; `none` falls back to the Basic preview cap.
  const maxPages = getPlanLimits(session.profile.plan).maxPagesPerSite;

  let generated;
  try {
    generated = await generateSite({
      businessName: input.businessName,
      businessType: input.businessType,
      businessDescription: input.businessDescription,
      contact,
      maxPages,
    });
  } catch (err) {
    console.error("Site generation failed:", err);
    return NextResponse.json(
      { error: "The AI failed to generate a site. Please try again." },
      { status: 502 }
    );
  }

  const supabase = await createClient();

  // Unique public slug: business name + short random suffix.
  const slug = `${baseSlugFor(input.businessName)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      owner_id: session.userId,
      slug,
      business_name: input.businessName,
      business_type: input.businessType,
      business_description: input.businessDescription,
      contact_info: contact,
      generated_content: { theme: generated.theme },
      published: false,
    })
    .select("id")
    .single<{ id: string }>();

  if (siteError || !site) {
    console.error("Failed to insert site:", siteError);
    return NextResponse.json(
      { error: "Could not save the generated site." },
      { status: 500 }
    );
  }

  const pageRows = generated.pages.map((p, i) => ({
    site_id: site.id,
    slug: p.slug || (i === 0 ? "home" : `page-${i}`),
    title: p.title,
    content: p.content,
    order: p.order ?? i,
  }));

  const { error: pagesError } = await supabase.from("pages").insert(pageRows);
  if (pagesError) {
    console.error("Failed to insert pages:", pagesError);
    // Roll back the orphaned site so the user isn't left with an empty shell.
    await supabase.from("sites").delete().eq("id", site.id);
    return NextResponse.json(
      { error: "Could not save the generated pages." },
      { status: 500 }
    );
  }

  return NextResponse.json({ siteId: site.id });
}
