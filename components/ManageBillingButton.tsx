"use client";

import { useState } from "react";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="rounded-md border border-foreground/15 px-3 py-1.5 text-sm hover:bg-foreground/5 disabled:opacity-50"
    >
      {loading ? "…" : "Manage billing"}
    </button>
  );
}
