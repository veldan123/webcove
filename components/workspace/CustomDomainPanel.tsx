"use client";

import { useState } from "react";

interface DnsRecord {
  type: string;
  name: string;
  value: string;
}

function dnsFor(domain: string): DnsRecord[] {
  const isApex = domain.split(".").length === 2;
  if (isApex) {
    return [
      { type: "A", name: "@", value: "216.198.79.1" },
      { type: "CNAME", name: "www", value: "cname.vercel-dns.com" },
    ];
  }
  return [
    { type: "CNAME", name: domain.split(".")[0], value: "cname.vercel-dns.com" },
  ];
}

export function CustomDomainPanel({
  siteId,
  initialDomain,
  initialVerified,
  onClose,
}: {
  siteId: string;
  initialDomain: string | null;
  initialVerified: boolean;
  onClose: () => void;
}) {
  const [domain, setDomain] = useState(initialDomain);
  const [verified, setVerified] = useState(initialVerified);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not connect that domain.");
        return;
      }
      setDomain(data.domain);
      setVerified(false);
      if (!data.automated) {
        setNote(
          "Heads up: automatic domain wiring isn't enabled, so this domain also needs to be added in the Vercel dashboard."
        );
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function check() {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/domain`);
      const data = await res.json();
      setVerified(!!data.verified);
      if (!data.verified)
        setNote("Not verified yet — DNS can take a few minutes to an hour.");
      else setNote(null);
    } catch {
      setError("Network error.");
    } finally {
      setChecking(false);
    }
  }

  async function disconnect() {
    setLoading(true);
    await fetch(`/api/sites/${siteId}/domain`, { method: "DELETE" });
    setDomain(null);
    setVerified(false);
    setInput("");
    setLoading(false);
  }

  const records = domain ? dnsFor(domain) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-foreground/10 bg-background p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Custom domain</h2>
            <p className="mt-1 text-sm text-foreground/60">
              Serve this published site on your own domain (e.g. yourbrand.com).
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-foreground/50 hover:bg-foreground/5"
          >
            ✕
          </button>
        </div>

        {!domain ? (
          <form onSubmit={connect} className="mt-6">
            <label className="mb-1.5 block text-sm font-medium">
              Your domain
            </label>
            <input
              required
              placeholder="yourbrand.com"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2.5 outline-none focus:border-foreground/40"
            />
            <p className="mt-2 text-xs text-foreground/50">
              Enter a domain you already own. You&apos;ll add two DNS records at
              your registrar to point it here. The site must be published for the
              domain to go live.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-strong disabled:opacity-50"
            >
              {loading ? "Connecting…" : "Connect domain"}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="flex items-center justify-between rounded-lg border border-foreground/10 px-4 py-3">
              <div>
                <p className="font-medium">{domain}</p>
                <p
                  className={`text-xs ${verified ? "text-green-600" : "text-amber-600"}`}
                >
                  {verified ? "✓ Live and verified" : "⏳ Waiting on DNS"}
                </p>
              </div>
              {verified && (
                <a
                  href={`https://${domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline"
                >
                  Visit
                </a>
              )}
            </div>

            {!verified && (
              <div>
                <p className="text-sm font-medium">1. Add these DNS records</p>
                <p className="mt-1 text-xs text-foreground/60">
                  In your domain registrar&apos;s DNS settings (e.g. GoDaddy →
                  your domain → DNS), add:
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs text-foreground/50">
                      <tr>
                        <th className="pb-1 pr-4">Type</th>
                        <th className="pb-1 pr-4">Name</th>
                        <th className="pb-1">Value</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-xs">
                      {records.map((r, i) => (
                        <tr key={i} className="border-t border-foreground/10">
                          <td className="py-2 pr-4">{r.type}</td>
                          <td className="py-2 pr-4">{r.name}</td>
                          <td className="py-2">{r.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 rounded-lg bg-foreground/[0.04] p-3 text-xs text-foreground/70">
                  <p className="font-medium text-foreground/80">
                    GoDaddy steps:
                  </p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                    <li>Sign in → your domain → DNS / Manage DNS.</li>
                    <li>
                      Edit the existing{" "}
                      <span className="font-mono">@</span> record (or add one) to
                      the values above — don&apos;t create duplicates with the
                      same name.
                    </li>
                    <li>Leave TTL at the default. Save.</li>
                    <li>
                      Come back and press <strong>Check status</strong> — DNS can
                      take a few minutes to an hour.
                    </li>
                  </ol>
                </div>

                <button
                  onClick={check}
                  disabled={checking}
                  className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-strong disabled:opacity-50"
                >
                  {checking ? "Checking…" : "Check status"}
                </button>
              </div>
            )}

            <button
              onClick={disconnect}
              disabled={loading}
              className="text-sm text-red-500 hover:underline"
            >
              Disconnect domain
            </button>
          </div>
        )}

        {note && <p className="mt-4 text-xs text-amber-600">{note}</p>}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
