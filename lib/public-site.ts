import { createPublicClient } from "./supabase/public";
import { isSiteLive } from "./site-status";
import type { PageRow, SiteRow, SiteTheme } from "./types";

export interface PublishedSite {
  site: SiteRow;
  pages: PageRow[];
  theme: SiteTheme | null;
}

/**
 * Loads a PUBLISHED site + its pages by slug, or null if not found/unpublished.
 * Relies on the public RLS policies (sites/pages where published = true).
 */
export async function getPublishedSite(
  slug: string
): Promise<PublishedSite | null> {
  const supabase = createPublicClient();

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle<SiteRow>();

  // An expired Agency sample keeps published = true in the DB but is no longer
  // live — treat it as not found.
  if (!site || !isSiteLive(site)) return null;

  const { data: pages } = await supabase
    .from("pages")
    .select("*")
    .eq("site_id", site.id)
    .order("order", { ascending: true })
    .returns<PageRow[]>();

  const theme: SiteTheme | null =
    (site.generated_content?.theme as SiteTheme | undefined) ?? null;

  return { site, pages: pages ?? [], theme };
}

/**
 * Loads a PUBLISHED site by its verified custom domain (used when a customer's
 * own domain serves their Webcove site), or null.
 */
export async function getPublishedSiteByDomain(
  host: string
): Promise<PublishedSite | null> {
  const supabase = createPublicClient();
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("custom_domain", host.toLowerCase())
    .eq("custom_domain_verified", true)
    .eq("published", true)
    .maybeSingle<SiteRow>();
  if (!site || !isSiteLive(site)) return null;

  const { data: pages } = await supabase
    .from("pages")
    .select("*")
    .eq("site_id", site.id)
    .order("order", { ascending: true })
    .returns<PageRow[]>();

  const theme: SiteTheme | null =
    (site.generated_content?.theme as SiteTheme | undefined) ?? null;
  return { site, pages: pages ?? [], theme };
}
