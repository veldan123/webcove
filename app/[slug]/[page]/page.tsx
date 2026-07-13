import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedSite } from "@/lib/public-site";
import { RESERVED_SLUGS } from "@/lib/slug";
import { SiteTemplate } from "@/components/SiteTemplate";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { slug, page } = await params;
  if (RESERVED_SLUGS.has(slug)) return {};
  const data = await getPublishedSite(slug);
  const pageRow = data?.pages.find((p) => p.slug === page);
  if (!data || !pageRow) return {};
  return { title: `${pageRow.title} — ${data.site.business_name}` };
}

export default async function PublicSubPage({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page } = await params;
  if (RESERVED_SLUGS.has(slug)) notFound();

  const data = await getPublishedSite(slug);
  if (!data) notFound();

  const pageRow = data.pages.find((p) => p.slug === page);
  if (!pageRow) notFound();

  const nav = data.pages.map((p) => ({ title: p.title, slug: p.slug }));

  return (
    <SiteTemplate
      theme={data.theme}
      businessName={data.site.business_name}
      page={pageRow.content}
      nav={nav}
      basePath={`/${slug}`}
    />
  );
}
