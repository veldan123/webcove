"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/lib/plans";

const PLANS: { key: Plan; label: string }[] = [
  { key: "none", label: "No plan" },
  { key: "basic", label: "Basic" },
  { key: "pro", label: "Pro" },
  { key: "agency", label: "Agency" },
];

// Test-only control (rendered only for whitelisted accounts) to switch plans
// instantly without paying. The server route re-checks the whitelist.
export function TestPlanSwitcher({ currentPlan }: { currentPlan: Plan }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setPlan(plan: Plan) {
    setBusy(plan);
    setError(null);
    try {
      const res = await fetch("/api/dev/set-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not set the plan.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
        🧪 Test account — set your plan instantly (no payment)
      </div>
      <p className="mt-1 text-xs text-foreground/60">
        Current plan: <span className="font-medium">{currentPlan}</span>. This
        only appears for the test account and skips Stripe entirely.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {PLANS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPlan(p.key)}
            disabled={busy !== null || currentPlan === p.key}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
              currentPlan === p.key
                ? "border-amber-500/50 bg-amber-500/20 text-amber-800 dark:text-amber-300"
                : "border-foreground/15 hover:bg-foreground/5"
            }`}
          >
            {busy === p.key ? "…" : p.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
