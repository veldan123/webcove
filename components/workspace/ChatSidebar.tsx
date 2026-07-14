"use client";

import { useRef, useState } from "react";
import type { PageContent, PageRow, SiteTheme } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function ChatSidebar({
  siteId,
  page,
  onPatched,
  onThemePatch,
}: {
  siteId: string;
  page: PageRow | null;
  onPatched: (pageId: string, content: PageContent) => void;
  onThemePatch: (theme: Partial<SiteTheme>) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setAttachedUrl(data.url);
        if (!input.trim()) setInput("Use this image as the logo");
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: data.error || "Couldn't upload that image." },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Upload failed. Please try again." },
      ]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!page || !input.trim() || loading || uploading) return;

    const instruction = input.trim();
    const imageUrl = attachedUrl;
    setInput("");
    setAttachedUrl(null);
    setMessages((m) => [
      ...m,
      { role: "user", text: (imageUrl ? "🖼️ " : "") + instruction },
    ]);
    setLoading(true);

    try {
      const res = await fetch(`/api/sites/${siteId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId: page.id,
          message: instruction,
          ...(imageUrl ? { imageUrl } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", text: data.error || "Sorry, I couldn't do that." },
        ]);
        return;
      }
      if (data.content) onPatched(page.id, data.content as PageContent);
      if (data.theme) onThemePatch(data.theme as Partial<SiteTheme>);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.reply || "Done." },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-foreground/10 px-4 py-3">
        <p className="text-sm font-medium">AI assistant</p>
        <p className="text-xs text-foreground/50">
          Editing <span className="font-medium">{page?.title ?? "—"}</span>. Ask
          for changes, upload a logo, or ask me anything.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2 text-xs text-foreground/50">
            <p>Try:</p>
            <ul className="space-y-1">
              <li>• “Make the headline punchier”</li>
              <li>• “Add a testimonials section”</li>
              <li>• 📎 Upload an image → “Use this as the logo”</li>
              <li>• “Change the primary color to green”</li>
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-auto bg-foreground text-background"
                : "bg-foreground/10"
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="max-w-[90%] rounded-lg bg-foreground/10 px-3 py-2 text-sm">
            Thinking…
          </div>
        )}
      </div>

      <form onSubmit={send} className="border-t border-foreground/10 p-3">
        {attachedUrl && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-foreground/10 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachedUrl}
              alt="attachment"
              className="h-10 w-10 rounded object-cover"
            />
            <span className="flex-1 text-xs text-foreground/60">
              Image attached
            </span>
            <button
              type="button"
              onClick={() => setAttachedUrl(null)}
              className="text-xs text-foreground/50 hover:text-foreground"
            >
              Remove
            </button>
          </div>
        )}
        <textarea
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e);
            }
          }}
          placeholder={page ? "Describe a change…" : "No page selected"}
          disabled={!page || loading}
          className="w-full resize-none rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40 disabled:opacity-50"
        />
        <div className="mt-2 flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!page || uploading}
            title="Attach an image"
            className="rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5 disabled:opacity-50"
          >
            {uploading ? "…" : "📎"}
          </button>
          <button
            type="submit"
            disabled={!page || loading || uploading || !input.trim()}
            className="flex-1 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
