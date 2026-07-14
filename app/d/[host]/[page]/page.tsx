import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedSiteByDomain } from "@/lib/public-site";
import { SiteTemplate } from "@/components/SiteTemplate";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string; page: string }>;
}): Promise<Metadata> {
  const { host, page } = await params;
  const data = await getPublishedSiteByDomain(host);
  const row = data?.pages.find((p) => p.slug === page);
  if (!data || !row) return {};
  return { title: `${row.title} — ${data.site.business_name}` };
}

// Sub-page served on a customer's connected custom domain.
export default async function CustomDomainSubPage({
  params,
}: {
  params: Promise<{ host: string; page: string }>;
}) {
  const { host, page } = await params;
  const data = await getPublishedSiteByDomain(host);
  if (!data) notFound();

  const row = data.pages.find((p) => p.slug === page);
  if (!row) notFound();

  const nav = data.pages.map((p) => ({ title: p.title, slug: p.slug }));

  return (
    <SiteTemplate
      theme={data.theme}
      businessName={data.site.business_name}
      page={row.content}
      nav={nav}
      basePath=""
    />
  );
}
