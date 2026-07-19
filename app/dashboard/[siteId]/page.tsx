import { notFound, redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { usageSummary } from "@/lib/usage";
import { Workspace } from "@/components/workspace/Workspace";
import type { PageRow, SiteRow, SiteTheme } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;

  const session = await getUserAndProfile();
  if (!session) redirect(`/login?redirect=/dashboard/${siteId}`);

  const supabase = await createClient();

  // RLS restricts this to sites the user owns (plus published ones); we also
  // check ownership explicitly below.
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .single<SiteRow>();

  if (!site || site.owner_id !== session.userId) notFound();

  const { data: pages } = await supabase
    .from("pages")
    .select("*")
    .eq("site_id", siteId)
    .order("order", { ascending: true })
    .returns<PageRow[]>();

  // Currently-published sites owned by the user (for Basic/Pro usage display).
  const { count: publishedCount } = await supabase
    .from("sites")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", session.userId)
    .eq("published", true);

  const usage = usageSummary(session.profile, publishedCount ?? 0);
  const theme: SiteTheme | null =
    (site.generated_content?.theme as SiteTheme | undefined) ?? null;

  return (
    <Workspace
      siteId={site.id}
      slug={site.slug}
      businessName={site.business_name}
      published={site.published}
      kept={site.kept}
      publishedAt={site.published_at}
      publishExpiresAt={site.publish_expires_at}
      brandingRemoved={site.branding_removed}
      theme={theme}
      initialPages={pages ?? []}
      plan={session.profile.plan}
      subscriptionStatus={session.profile.subscription_status}
      usageLabel={usage.label}
      usageAtLimit={usage.atLimit}
      customDomain={site.custom_domain}
      customDomainVerified={site.custom_domain_verified}
    />
  );
}
