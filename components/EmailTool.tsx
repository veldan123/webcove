"use client";

import { useState } from "react";

export function EmailTool() {
  const [form, setForm] = useState({
    recipientBusinessName: "",
    recipientEmail: "",
    priceQuoted: "",
    recurringFee: "",
    subject: "",
  });
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  const field =
    "w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2.5 outline-none focus:border-foreground/40";

  async function generateDraft(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);
    setDrafting(true);
    try {
      const res = await fetch("/api/email/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientBusinessName: form.recipientBusinessName,
          priceQuoted: Number(form.priceQuoted),
          recurringFee: Number(form.recurringFee),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not draft the email.");
        return;
      }
      setDraft(data.body);
    } catch {
      setError("Network error.");
    } finally {
      setDrafting(false);
    }
  }

  async function send() {
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: form.recipientEmail,
          recipientBusinessName: form.recipientBusinessName,
          priceQuoted: Number(form.priceQuoted),
          recurringFee: Number(form.recurringFee),
          emailBody: draft,
          subject: form.subject || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send.");
        return;
      }
      setSent(true);
      setConfirming(false);
      setDraft("");
    } catch {
      setError("Network error.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={generateDraft} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Recipient business name
            </label>
            <input
              required
              className={field}
              value={form.recipientBusinessName}
              onChange={update("recipientBusinessName")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Recipient email
            </label>
            <input
              required
              type="email"
              className={field}
              value={form.recipientEmail}
              onChange={update("recipientEmail")}
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
              value={form.priceQuoted}
              onChange={update("priceQuoted")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Recurring monthly fee ($)
            </label>
            <input
              required
              type="number"
              min="0"
              className={field}
              value={form.recurringFee}
              onChange={update("recurringFee")}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={drafting}
          className="rounded-lg border border-foreground/15 px-4 py-2.5 text-sm font-medium hover:bg-foreground/5 disabled:opacity-50"
        >
          {drafting ? "Drafting…" : draft ? "Re-draft" : "Draft email with AI"}
        </button>
      </form>

      {draft && (
        <div className="space-y-3 rounded-xl border border-foreground/10 p-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Subject</label>
            <input
              className={field}
              placeholder={`A professional website for ${form.recipientBusinessName}`}
              value={form.subject}
              onChange={update("subject")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Email body (edit before sending)
            </label>
            <textarea
              rows={10}
              className={field}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </div>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:opacity-90"
            >
              Review & send
            </button>
          ) : (
            <div className="rounded-lg border border-foreground/20 bg-foreground/5 p-4">
              <p className="text-sm">
                Send this email to{" "}
                <span className="font-medium">{form.recipientEmail}</span>?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={send}
                  disabled={sending}
                  className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Confirm & send"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={sending}
                  className="rounded-lg border border-foreground/15 px-4 py-2 text-sm hover:bg-foreground/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
      {sent && (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
          ✓ Email sent and logged.
        </p>
      )}
    </div>
  );
}
