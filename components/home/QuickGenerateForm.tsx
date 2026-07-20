"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Simple homepage form: three boxes, no contact fields. On submit we stash the
// details and send the visitor to /generate, which makes them sign up (if
// needed) and then auto-generates the site — no second button press.
export const PENDING_KEY = "wc_pending_generate";

export function QuickGenerateForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    businessDescription: "",
  });

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(form));
    } catch {
      /* ignore storage errors */
    }
    router.push("/generate");
  }

  const field =
    "w-full rounded-lg border border-foreground/15 bg-background/70 px-4 py-3 text-left outline-none backdrop-blur-sm placeholder:text-foreground/60 focus:border-primary/50";

  return (
    <div className="wc-beam mx-auto mt-8 w-full max-w-md">
      <form
        onSubmit={onSubmit}
        className="wc-beam-inner space-y-3 p-5 text-left backdrop-blur-md"
      >
      <input
        required
        className={field}
        placeholder="Business name (e.g. Rosie's Café)"
        value={form.businessName}
        onChange={update("businessName")}
      />
      <input
        required
        className={field}
        placeholder="What kind of business? (e.g. coffee shop)"
        value={form.businessType}
        onChange={update("businessType")}
      />
      <textarea
        required
        rows={3}
        className={field}
        placeholder="What do you do? (one or two sentences)"
        value={form.businessDescription}
        onChange={update("businessDescription")}
      />
      <button
        type="submit"
        className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-white shadow-md shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary-strong"
      >
        Generate my website — free
      </button>
        <p className="text-center text-xs text-foreground/60">
          Free to build &amp; preview. You&apos;ll create a quick account, then
          it builds automatically.
        </p>
      </form>
    </div>
  );
}
