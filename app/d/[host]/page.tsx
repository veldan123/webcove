import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedSiteByDomain } from "@/lib/public-site";
import { SiteTemplate } from "@/components/SiteTemplate";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string }>;
}): Promise<Metadata> {
  const { host } = await params;
  const data = await getPublishedSiteByDomain(host);
  if (!data) return {};
  return {
    title: data.site.business_name,
    description: data.site.business_description.slice(0, 160),
  };
}

// Home page served on a customer's connected custom domain.
export default async function CustomDomainHome({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const data = await getPublishedSiteByDomain(host);
  if (!data) notFound();

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
      basePath=""
      showBranding={!data.site.branding_removed}
    />
  );
}
