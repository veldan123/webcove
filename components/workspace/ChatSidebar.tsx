"use client";

import { useState } from "react";
import type { PageContent, PageRow } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function ChatSidebar({
  siteId,
  page,
  onPatched,
}: {
  siteId: string;
  page: PageRow | null;
  onPatched: (pageId: string, content: PageContent) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!page || !input.trim() || loading) return;

    const instruction = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: instruction }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/sites/${siteId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId: page.id, message: instruction }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: data.error || "Sorry, I couldn't apply that.",
          },
        ]);
        return;
      }
      onPatched(page.id, data.content as PageContent);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Done — updated the preview." },
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
        <p className="text-sm font-medium">AI editor</p>
        <p className="text-xs text-foreground/50">
          Editing{" "}
          <span className="font-medium">{page?.title ?? "—"}</span>. Ask for
          changes in plain English.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2 text-xs text-foreground/50">
            <p>Try:</p>
            <ul className="space-y-1">
              <li>• “Make the headline punchier”</li>
              <li>• “Add a testimonials section”</li>
              <li>• “Change the about copy to be more formal”</li>
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

      <form
        onSubmit={send}
        className="border-t border-foreground/10 p-3"
      >
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
        <button
          type="submit"
          disabled={!page || loading || !input.trim()}
          className="mt-2 w-full rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
