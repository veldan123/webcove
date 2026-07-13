"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/lib/plans";

export function SubscribeButton({
  plan,
  isAuthed,
  isCurrent,
  label,
}: {
  plan: Exclude<Plan, "none">;
  isAuthed: boolean;
  isCurrent: boolean;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function subscribe() {
    if (!isAuthed) {
      router.push(`/login?redirect=/pricing`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Could not start checkout.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={subscribe}
        disabled={loading || isCurrent}
        className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
      >
        {isCurrent ? "Current plan" : loading ? "…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
