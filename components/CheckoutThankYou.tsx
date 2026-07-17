"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

// Celebratory thank-you shown after a successful Stripe checkout
// (?checkout=success on the dashboard).
export function CheckoutThankYou() {
  const params = useSearchParams();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (params.get("checkout") !== "success" || dismissed) return null;

  function close() {
    setDismissed(true);
    router.replace("/dashboard");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-foreground/10 bg-background p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-3xl text-white">
          ✓
        </div>
        <h2 className="mt-5 text-xl font-semibold tracking-tight">
          Thank you for subscribing! 🎉
        </h2>
        <p className="mt-2 text-sm text-foreground/60">
          Your plan is now active. You can publish your sites live and unlock the
          rest of Webcove whenever you&apos;re ready.
        </p>
        <button
          onClick={close}
          className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-strong"
        >
          Go to my dashboard
        </button>
      </div>
    </div>
  );
}
