"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan, SubscriptionStatus } from "@/lib/plans";

export function PublishControls({
  siteId,
  published,
  subscriptionStatus,
  onChange,
}: {
  siteId: string;
  published: boolean;
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  usageAtLimit: boolean;
  onChange: (published: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/publish`, {
        method: "POST",
      });
      const data = await res.json();

      // Server signals the user needs an active subscription.
      if (res.status === 402 || data.redirectToCheckout) {
        router.push("/pricing");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Could not publish.");
        return;
      }
      onChange(true);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function unpublish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/unpublish`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not unpublish.");
        return;
      }
      onChange(false);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {published ? (
        <button
          onClick={unpublish}
          disabled={loading}
          className="rounded-lg border border-foreground/15 px-4 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
        >
          {loading ? "…" : "Unpublish"}
        </button>
      ) : (
        <button
          onClick={publish}
          disabled={loading}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-strong disabled:opacity-50"
          title={
            subscriptionStatus !== "active"
              ? "You'll be taken to choose a plan"
              : undefined
          }
        >
          {loading ? "Publishing…" : "Publish"}
        </button>
      )}
      {error && (
        <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-red-500/30 bg-background p-3 text-xs text-red-500 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
