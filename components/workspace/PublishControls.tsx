"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan, SubscriptionStatus } from "@/lib/plans";
import { KEEP_SITE_PRICE_USD, BRANDING_REMOVAL_PRICE_USD } from "@/lib/site-status";

function remainingLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 1) return `${h}h ${m}m left`;
  return `${m}m left`;
}

export function PublishControls({
  siteId,
  published,
  plan,
  kept,
  publishedAt,
  publishExpiresAt,
  brandingRemoved,
  subscriptionStatus,
  onChange,
}: {
  siteId: string;
  published: boolean;
  plan: Plan;
  kept: boolean;
  publishedAt: string | null;
  publishExpiresAt: string | null;
  brandingRemoved: boolean;
  subscriptionStatus: SubscriptionStatus;
  usageAtLimit: boolean;
  onChange: (published: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [keeping, setKeeping] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showBrandingPrompt, setShowBrandingPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(publishExpiresAt);
  const [, force] = useState(0);

  const isAgencySample = plan === "agency" && !kept;
  const sampleLive =
    isAgencySample && published && !!expiresAt && new Date(expiresAt) > new Date();

  // Tick every 30s so the countdown stays fresh.
  useEffect(() => {
    if (!sampleLive) return;
    const t = setInterval(() => force((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, [sampleLive]);

  async function publish() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/publish`, { method: "POST" });
      const data = await res.json();
      if (res.status === 402 || data.redirectToCheckout) {
        router.push("/pricing");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Could not publish.");
        return;
      }
      if (data.publishExpiresAt) setExpiresAt(data.publishExpiresAt);
      onChange(true);
      // Offer to remove the badge right after publishing. Agency users don't
      // get this here — their 48h sample carries no badge; they're prompted
      // after the client approves (see KeptThankYou).
      if (!brandingRemoved && plan !== "agency") setShowBrandingPrompt(true);
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
      const res = await fetch(`/api/sites/${siteId}/unpublish`, { method: "POST" });
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

  // "Approved website" → pay the one-time fee to keep the sample live for good.
  async function keepSite() {
    setKeeping(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/keep`, { method: "POST" });
      const data = await res.json();
      if (data.alreadyKept) {
        router.refresh();
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error || "Could not start checkout.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error.");
      setKeeping(false);
    }
  }

  // Pay the one-time fee to remove the "Built with Webcove" badge.
  async function removeBranding() {
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/remove-branding`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.alreadyRemoved) {
        setShowBrandingPrompt(false);
        router.refresh();
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error || "Could not start checkout.");
        setRemoving(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error.");
      setRemoving(false);
    }
  }

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {/* Kept (approved + paid) permanent site */}
      {kept ? (
        <>
          <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400">
            ● Live · kept
          </span>
          <button
            onClick={unpublish}
            disabled={loading}
            className="rounded-lg border border-foreground/15 px-4 py-2 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
          >
            {loading ? "…" : "Unpublish"}
          </button>
        </>
      ) : isAgencySample ? (
        <>
          {sampleLive ? (
            <span
              className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
              title="Sample sites come down automatically after 48 hours"
            >
              ● Sample · {remainingLabel(expiresAt!)}
            </span>
          ) : (
            <button
              onClick={publish}
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-strong disabled:opacity-50"
              title={
                subscriptionStatus !== "active"
                  ? "You'll be taken to choose a plan"
                  : "Publishes a preview for your client for 48 hours"
              }
            >
              {loading ? "Publishing…" : "Publish for 48 hours"}
            </button>
          )}
          {/* Once a sample has been published, they can pay to keep it after approval */}
          {publishedAt && (
            <button
              onClick={keepSite}
              disabled={keeping}
              className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-500/20 disabled:opacity-50 dark:text-green-400"
              title={`Client approved? Keep it live permanently for $${KEEP_SITE_PRICE_USD} (one-time)`}
            >
              {keeping ? "…" : `✓ Approved website · $${KEEP_SITE_PRICE_USD}`}
            </button>
          )}
        </>
      ) : published ? (
        /* Basic / Pro permanent publish */
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

      {/* After-publish prompt: offer to remove the Webcove badge */}
      {showBrandingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-background p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-2xl text-white">
              ✓
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              You&apos;re live! 🎉
            </h2>
            <p className="mt-2 text-sm text-foreground/60">
              Your site shows a small{" "}
              <span className="font-medium text-foreground/80">
                “⚡ Built with Webcove”
              </span>{" "}
              badge in the footer. Want to remove it and make the site fully
              yours?
            </p>
            <button
              onClick={removeBranding}
              disabled={removing}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-strong disabled:opacity-50"
            >
              {removing
                ? "…"
                : `Remove badge — $${BRANDING_REMOVAL_PRICE_USD} one-time`}
            </button>
            <button
              onClick={() => setShowBrandingPrompt(false)}
              className="mt-2 w-full rounded-lg px-4 py-2 text-sm text-foreground/60 hover:text-foreground"
            >
              Keep the badge (it&apos;s fine)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
