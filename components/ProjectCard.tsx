"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SiteRow } from "@/lib/types";

// Dashboard project card that shows a "Loading…" overlay when tapped, since
// opening the workspace takes a moment (especially on mobile).
export function ProjectCard({ site }: { site: SiteRow }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={() => {
        setLoading(true);
        router.push(`/dashboard/${site.id}`);
      }}
      className="group relative flex flex-col rounded-xl border border-foreground/10 p-5 text-left transition hover:border-foreground/30"
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
      <p className="mt-1 text-sm text-foreground/60">{site.business_type}</p>
      <p className="mt-3 line-clamp-2 text-sm text-foreground/50">
        {site.business_description}
      </p>
      <span className="mt-4 text-xs text-foreground/40">/{site.slug}</span>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-background/75 backdrop-blur-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-primary" />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      )}
    </button>
  );
}
