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
  rejected: initialRejected,
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
  rejected: boolean;
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
  const [rejecting, setRejecting] = useState(false);
  const [rejected, setRejected] = useState(initialRejected);
  // Which decision dialog is open: after publishing we explain the flow,
  // then the user explicitly picks approve or reject.
  const [dialog, setDialog] = useState<
    null | "published" | "approve" | "reject"
  >(null);
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
      if (plan === "agency") {
        // Explain what happens next so the approve/reject step makes sense.
        setDialog("published");
      } else if (!brandingRemoved) {
        // Basic/Pro get the badge-removal offer right after publishing.
        setShowBrandingPrompt(true);
      }
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

  // Client said no — record it. The publish is still spent.
  async function rejectSite() {
    setRejecting(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/reject`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save that.");
        setRejecting(false);
        return;
      }
      setRejected(true);
      setDialog(null);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setRejecting(false);
    }
  }

  // Client said yes → pay the one-time fee to keep the site live for good.
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
          {/* Explicit client decision once a sample has gone out */}
          {rejected ? (
            <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400">
              ✕ Client rejected
            </span>
          ) : (
            publishedAt && (
              <>
                <span className="text-xs text-foreground/50">
                  Client replied?
                </span>
                <button
                  onClick={() => setDialog("approve")}
                  className="rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-500/20 dark:text-green-400"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => setDialog("reject")}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-500/20 dark:text-red-400"
                >
                  ❌ Reject
                </button>
              </>
            )
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

      {/* Agency: explain the flow right after the sample goes live */}
      {dialog === "published" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-foreground/10 bg-background p-7 shadow-2xl">
            <h2 className="text-lg font-semibold tracking-tight">
              Your 48-hour sample is live ⏳
            </h2>
            <ol className="mt-4 space-y-2.5 text-sm text-foreground/70">
              <li>
                <span className="font-medium text-foreground/90">1.</span> Send
                the link to the business (the Email tool does this for you).
              </li>
              <li>
                <span className="font-medium text-foreground/90">2.</span> The
                site comes down automatically after 48 hours.
              </li>
              <li>
                <span className="font-medium text-foreground/90">3.</span> When
                they reply, come back here and choose{" "}
                <span className="font-medium text-green-600 dark:text-green-400">
                  Approve
                </span>{" "}
                or{" "}
                <span className="font-medium text-red-600 dark:text-red-400">
                  Reject
                </span>
                .
              </li>
            </ol>
            <p className="mt-4 rounded-lg bg-foreground/[0.04] p-3 text-xs text-foreground/60">
              Heads up: this publish already used <strong>1 of your 10</strong>{" "}
              this month — that counts whether they say yes or no.
            </p>
            <button
              onClick={() => setDialog(null)}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-strong"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Approve confirmation */}
      {dialog === "approve" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-background p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-2xl text-white">
              ✓
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              The client approved it?
            </h2>
            <p className="mt-2 text-sm text-foreground/60">
              Pay a one-time{" "}
              <strong>${KEEP_SITE_PRICE_USD}</strong> and this site stays live
              permanently for them — the 48-hour limit is removed.
            </p>
            <button
              onClick={keepSite}
              disabled={keeping}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-strong disabled:opacity-50"
            >
              {keeping ? "…" : `Yes, keep it live — $${KEEP_SITE_PRICE_USD}`}
            </button>
            <button
              onClick={() => setDialog(null)}
              className="mt-2 w-full rounded-lg px-4 py-2 text-sm text-foreground/60 hover:text-foreground"
            >
              Cancel
            </button>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>
        </div>
      )}

      {/* Reject confirmation */}
      {dialog === "reject" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-background p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-2xl text-white">
              ✕
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              The client turned it down?
            </h2>
            <p className="mt-2 text-sm text-foreground/60">
              We&apos;ll mark this one as rejected. The sample comes down when
              the 48 hours end — no further charge.
            </p>
            <p className="mt-3 rounded-lg bg-foreground/[0.04] p-3 text-xs text-foreground/60">
              This publish still counts as <strong>1 of your 10</strong> this
              month. Rejections aren&apos;t refunded.
            </p>
            <button
              onClick={rejectSite}
              disabled={rejecting}
              className="mt-5 w-full rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              {rejecting ? "…" : "Mark as rejected"}
            </button>
            <button
              onClick={() => setDialog(null)}
              className="mt-2 w-full rounded-lg px-4 py-2 text-sm text-foreground/60 hover:text-foreground"
            >
              Cancel
            </button>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>
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
