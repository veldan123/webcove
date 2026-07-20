"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { BRANDING_REMOVAL_PRICE_USD } from "@/lib/site-status";

// Shown after the one-time "keep this site" payment succeeds
// (?kept=success on the workspace page). Because the site is now approved and
// permanent, it starts showing the "Built with Webcove" badge — so this is
// where Agency users get offered the paid removal.
export function KeptThankYou({
  siteId,
  brandingRemoved,
}: {
  siteId: string;
  brandingRemoved: boolean;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (params.get("kept") !== "success" || dismissed) return null;

  function close() {
    setDismissed(true);
    router.replace(`/dashboard/${siteId}`);
  }

  async function removeBranding() {
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/remove-branding`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.alreadyRemoved) {
        close();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-background p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-3xl text-white">
          ✓
        </div>
        <h2 className="mt-5 text-xl font-semibold tracking-tight">
          Website kept! 🎉
        </h2>
        <p className="mt-2 text-sm text-foreground/60">
          This site is now live permanently for your client — no more 48-hour
          limit. Nice work closing the deal.
        </p>

        {!brandingRemoved && (
          <div className="mt-5 rounded-xl border border-foreground/10 bg-foreground/[0.03] p-4 text-left">
            <p className="text-sm text-foreground/70">
              Now that it&apos;s live, it shows a small{" "}
              <span className="font-medium text-foreground/90">
                “⚡ Built with Webcove”
              </span>{" "}
              badge. Remove it so the site looks fully your client&apos;s.
            </p>
            <button
              onClick={removeBranding}
              disabled={removing}
              className="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-strong disabled:opacity-50"
            >
              {removing
                ? "…"
                : `Remove badge — $${BRANDING_REMOVAL_PRICE_USD} one-time`}
            </button>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>
        )}

        <button
          onClick={close}
          className="mt-4 w-full rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5"
        >
          Done
        </button>
      </div>
    </div>
  );
}
