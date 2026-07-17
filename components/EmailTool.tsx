"use client";

import { useState } from "react";

export interface EmailToolSite {
  id: string;
  name: string;
  url: string;
}

export function EmailTool({ projects = [] }: { projects?: EmailToolSite[] }) {
  const [form, setForm] = useState({
    recipientBusinessName: "",
    priceQuoted: "",
    hasRecurring: false,
    recurringFee: "",
    recurringPeriod: "month" as "month" | "year",
    subject: "",
    siteId: "" as string,
  });
  const [body, setBody] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"" | "body" | "subject" | "both">("");

  const field =
    "w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2.5 outline-none focus:border-foreground/40";

  async function generateDraft(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCopied("");
    setDrafting(true);
    const selected = projects.find((p) => p.id === form.siteId);
    try {
      const res = await fetch("/api/email/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientBusinessName: form.recipientBusinessName,
          priceQuoted: Number(form.priceQuoted),
          recurringFee:
            form.hasRecurring && form.recurringFee
              ? Number(form.recurringFee)
              : null,
          recurringPeriod: form.recurringPeriod,
          siteUrl: selected?.url,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not draft the email.");
        return;
      }
      setBody(data.body);
      if (!form.subject) {
        setForm((f) => ({
          ...f,
          subject: `A professional website for ${f.recipientBusinessName}`,
        }));
      }
    } catch {
      setError("Network error.");
    } finally {
      setDrafting(false);
    }
  }

  async function copy(what: "body" | "subject" | "both") {
    const text =
      what === "body"
        ? body
        : what === "subject"
          ? form.subject
          : `Subject: ${form.subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setError("Couldn't copy — select the text and copy manually.");
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={generateDraft} className="space-y-4">
        {projects.length > 0 && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Which site are you selling?
            </label>
            <select
              className={field}
              value={form.siteId}
              onChange={(e) =>
                setForm((f) => ({ ...f, siteId: e.target.value }))
              }
            >
              <option value="">No preview link</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {form.siteId && (
              <p className="mt-1.5 text-xs text-foreground/50">
                {projects.find((p) => p.id === form.siteId)?.url} will be
                included in the email so the prospect can view their sample.
              </p>
            )}
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Recipient business name
          </label>
          <input
            required
            className={field}
            placeholder="Rosa's Trattoria"
            value={form.recipientBusinessName}
            onChange={(e) =>
              setForm((f) => ({ ...f, recipientBusinessName: e.target.value }))
            }
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            One-time build price ($)
          </label>
          <input
            required
            type="number"
            min="0"
            className={field}
            placeholder="750"
            value={form.priceQuoted}
            onChange={(e) =>
              setForm((f) => ({ ...f, priceQuoted: e.target.value }))
            }
          />
        </div>

        <div className="rounded-lg border border-foreground/10 p-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.hasRecurring}
              onChange={(e) =>
                setForm((f) => ({ ...f, hasRecurring: e.target.checked }))
              }
              className="h-4 w-4 accent-[var(--primary)]"
            />
            Add a recurring hosting fee
            <span className="font-normal text-foreground/50">(optional)</span>
          </label>

          {form.hasRecurring && (
            <div className="mt-4 flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs text-foreground/60">
                  Recurring fee ($)
                </label>
                <input
                  type="number"
                  min="0"
                  className={field}
                  placeholder="25"
                  value={form.recurringFee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recurringFee: e.target.value }))
                  }
                />
              </div>
              <div className="w-32">
                <label className="mb-1.5 block text-xs text-foreground/60">
                  Per
                </label>
                <select
                  className={field}
                  value={form.recurringPeriod}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      recurringPeriod: e.target.value as "month" | "year",
                    }))
                  }
                >
                  <option value="month">month</option>
                  <option value="year">year</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={drafting}
          className="rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
        >
          {drafting ? "Drafting…" : body ? "Re-draft with AI" : "Draft email with AI"}
        </button>
      </form>

      {body && (
        <div className="space-y-4 rounded-xl border border-foreground/10 p-4">
          <p className="text-sm text-foreground/60">
            Review and edit below, then copy it into your own email app to send.
          </p>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">Subject</label>
              <button
                type="button"
                onClick={() => copy("subject")}
                className="text-xs text-primary hover:underline"
              >
                {copied === "subject" ? "Copied!" : "Copy"}
              </button>
            </div>
            <input
              className={field}
              value={form.subject}
              onChange={(e) =>
                setForm((f) => ({ ...f, subject: e.target.value }))
              }
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">Email body</label>
              <button
                type="button"
                onClick={() => copy("body")}
                className="text-xs text-primary hover:underline"
              >
                {copied === "body" ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              rows={12}
              className={field}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => copy("both")}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-strong"
          >
            {copied === "both" ? "✓ Copied subject + body" : "Copy full email"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
