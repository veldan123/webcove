import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { usageSummary } from "@/lib/usage";
import type { SiteRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getUserAndProfile();
  if (!session) redirect("/login?redirect=/dashboard");
  const { profile } = session;

  const supabase = await createClient();
  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<SiteRow[]>();

  const list = sites ?? [];
  const publishedCount = list.filter((s) => s.published).length;
  const usage = usageSummary(profile, publishedCount);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your projects
          </h1>
          <p className="mt-1 text-sm text-foreground/60">{usage.label}</p>
        </div>
        <div className="flex items-center gap-3">
          {profile.plan === "none" && (
            <Link
              href="/pricing"
              className="rounded-lg border border-foreground/15 px-4 py-2 text-sm font-medium hover:bg-foreground/5"
            >
              Choose a plan
            </Link>
          )}
          <Link
            href="/dashboard/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-strong"
          >
            + New site
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-12 rounded-xl border border-dashed border-foreground/20 p-12 text-center">
          <h2 className="font-medium">No sites yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/60">
            Describe your business and Webcove&apos;s AI will generate a full
            website you can preview for free.
          </p>
          <Link
            href="/dashboard/new"
            className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-strong"
          >
            Create your first site
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((site) => (
            <Link
              key={site.id}
              href={`/dashboard/${site.id}`}
              className="group flex flex-col rounded-xl border border-foreground/10 p-5 transition hover:border-foreground/30"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold group-hover:underline">
                  {site.business_name}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    site.published
                      ? "bg-green-500/15 text-green-600 dark:text-green-400"
                      : "bg-foreground/10 text-foreground/60"
                  }`}
                >
                  {site.published ? "Published" : "Draft"}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground/60">
                {site.business_type}
              </p>
              <p className="mt-3 line-clamp-2 text-sm text-foreground/50">
                {site.business_description}
              </p>
              <span className="mt-4 text-xs text-foreground/40">
                /{site.slug}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
