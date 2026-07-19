import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedSite } from "@/lib/public-site";
import { RESERVED_SLUGS } from "@/lib/slug";
import { SiteTemplate } from "@/components/SiteTemplate";

export const revalidate = 60; // ISR: refresh published sites at most once a minute

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug)) return {};
  const data = await getPublishedSite(slug);
  if (!data) return {};
  return {
    title: data.site.business_name,
    description: data.site.business_description.slice(0, 160),
  };
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug)) notFound();

  const data = await getPublishedSite(slug);
  if (!data) notFound();

  // Home page = the one with slug "home", else the first by order.
  const home =
    data.pages.find((p) => p.slug === "home") ?? data.pages[0] ?? null;
  if (!home) notFound();

  const nav = data.pages.map((p) => ({ title: p.title, slug: p.slug }));

  return (
    <SiteTemplate
      theme={data.theme}
      businessName={data.site.business_name}
      page={home.content}
      nav={nav}
      basePath={`/${slug}`}
      showBranding={!data.site.branding_removed}
    />
  );
}
