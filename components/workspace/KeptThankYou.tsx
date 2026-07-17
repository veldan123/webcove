"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

// Shown after the one-time "keep this site" payment succeeds
// (?kept=success on the workspace page).
export function KeptThankYou({ siteId }: { siteId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (params.get("kept") !== "success" || dismissed) return null;

  function close() {
    setDismissed(true);
    router.replace(`/dashboard/${siteId}`);
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
        <button
          onClick={close}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-strong"
        >
          Done
        </button>
      </div>
    </div>
  );
}
