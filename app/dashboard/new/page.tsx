"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GenerationSplash } from "@/components/GenerationSplash";

export default function NewSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    businessName: "",
    businessType: "",
    businessDescription: "",
    phone: "",
    email: "",
    address: "",
    tagline: "",
  });

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push(`/dashboard/${data.siteId}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const field =
    "w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2.5 outline-none focus:border-foreground/40";

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      {loading && <GenerationSplash />}
      <Link
        href="/dashboard"
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Describe your business
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        Webcove&apos;s AI will generate a full website from these details. This
        is free — you only need a plan to publish.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Business name
          </label>
          <input
            required
            className={field}
            placeholder="Acme Plumbing"
            value={form.businessName}
            onChange={update("businessName")}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Business type / category
          </label>
          <input
            required
            className={field}
            placeholder="Plumbing & heating services"
            value={form.businessType}
            onChange={update("businessType")}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            What you do / services offered
          </label>
          <textarea
            required
            rows={4}
            className={field}
            placeholder="We're a family-run plumbing company serving the Bristol area, offering emergency repairs, boiler installs, and bathroom fitting."
            value={form.businessDescription}
            onChange={update("businessDescription")}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Tagline / differentiator{" "}
            <span className="text-foreground/40">(optional)</span>
          </label>
          <input
            className={field}
            placeholder="24/7 callouts, no fix no fee"
            value={form.tagline}
            onChange={update("tagline")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Phone <span className="text-foreground/40">(optional)</span>
            </label>
            <input
              className={field}
              value={form.phone}
              onChange={update("phone")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Email <span className="text-foreground/40">(optional)</span>
            </label>
            <input
              className={field}
              value={form.email}
              onChange={update("email")}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Address <span className="text-foreground/40">(optional)</span>
          </label>
          <input
            className={field}
            value={form.address}
            onChange={update("address")}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-white hover:bg-primary-strong disabled:opacity-50"
        >
          {loading ? "Generating your site…" : "Generate my website"}
        </button>
        {loading && (
          <p className="text-center text-xs text-foreground/50">
            This can take 15–30 seconds while the AI writes your copy.
          </p>
        )}
      </form>
    </div>
  );
}
