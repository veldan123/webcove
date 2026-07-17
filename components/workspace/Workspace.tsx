"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SiteTemplate } from "@/components/SiteTemplate";
import { ChatSidebar } from "@/components/workspace/ChatSidebar";
import { PublishControls } from "@/components/workspace/PublishControls";
import { CustomDomainPanel } from "@/components/workspace/CustomDomainPanel";
import type { PageContent, PageRow, SiteTheme } from "@/lib/types";
import type { Plan, SubscriptionStatus } from "@/lib/plans";

export function Workspace({
  siteId,
  slug,
  businessName,
  published: initialPublished,
  theme,
  initialPages,
  plan,
  subscriptionStatus,
  usageLabel,
  usageAtLimit,
  customDomain,
  customDomainVerified,
}: {
  siteId: string;
  slug: string;
  businessName: string;
  published: boolean;
  theme: SiteTheme | null;
  initialPages: PageRow[];
  plan: Plan;
  subscriptionStatus: SubscriptionStatus;
  usageLabel: string;
  usageAtLimit: boolean;
  customDomain: string | null;
  customDomainVerified: boolean;
}) {
  const [pages, setPages] = useState<PageRow[]>(initialPages);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPages[0]?.id ?? null
  );
  const [published, setPublished] = useState(initialPublished);
  const [showDomain, setShowDomain] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const [themeState, setThemeState] = useState<SiteTheme | null>(theme);
  const [flash, setFlash] = useState(false);

  // Briefly highlight the preview so a live edit is obvious.
  function bump() {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 900);
  }

  function applyThemePatch(patch: Partial<SiteTheme>) {
    setThemeState((prev) => ({ ...(prev ?? {}), ...patch }) as SiteTheme);
    bump();
  }

  const selectedPage = useMemo(
    () => pages.find((p) => p.id === selectedId) ?? pages[0] ?? null,
    [pages, selectedId]
  );

  const nav = pages.map((p) => ({ title: p.title, slug: p.slug }));
  const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/${slug}`;

  function applyPageContent(pageId: string, content: PageContent) {
    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, content } : p))
    );
    bump();
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-foreground/60 hover:text-foreground"
          >
            ← Dashboard
          </Link>
          <span className="font-semibold">{businessName}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              published
                ? "bg-green-500/15 text-green-600 dark:text-green-400"
                : "bg-foreground/10 text-foreground/60"
            }`}
          >
            {published ? "Published" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-foreground/50 sm:inline">
            {usageLabel}
          </span>
          <button
            onClick={() => setShowDomain(true)}
            className="rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5"
            title="Connect a custom domain"
          >
            🌐 Domain
            {customDomainVerified && (
              <span className="ml-1 text-green-500">●</span>
            )}
          </button>
          {published && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-foreground/70 underline hover:text-foreground"
            >
              View live
            </a>
          )}
          <PublishControls
            siteId={siteId}
            published={published}
            plan={plan}
            subscriptionStatus={subscriptionStatus}
            usageAtLimit={usageAtLimit}
            onChange={setPublished}
          />
        </div>
      </div>

      {/* Mobile controls: page switcher + open AI assistant */}
      <div className="flex items-center gap-2 border-b border-foreground/10 px-4 py-2 lg:hidden">
        <select
          value={selectedPage?.id ?? ""}
          onChange={(e) => setSelectedId(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none"
        >
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowChatMobile(true)}
          className="shrink-0 rounded-lg border border-foreground/15 px-3 py-2 text-sm hover:bg-foreground/5"
        >
          💬 AI
        </button>
      </div>

      {/* Body: page list | preview | chat */}
      <div className="flex min-h-0 flex-1">
        {/* Page list */}
        <aside className="hidden w-52 shrink-0 overflow-y-auto border-r border-foreground/10 p-3 md:block">
          <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-foreground/40">
            Pages
          </p>
          <ul className="space-y-1">
            {pages.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                    selectedPage?.id === p.id
                      ? "bg-foreground/10 font-medium"
                      : "hover:bg-foreground/5"
                  }`}
                >
                  {p.title}
                  <span className="block text-xs text-foreground/40">
                    /{p.slug}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Live preview */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-foreground/[0.03] p-4">
          <div
            className={`mx-auto max-w-4xl overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-300 ${
              flash
                ? "border-primary/60 ring-4 ring-primary/25"
                : "border-foreground/10 ring-0"
            }`}
          >
            {selectedPage ? (
              <SiteTemplate
                theme={themeState}
                businessName={businessName}
                page={selectedPage.content}
                nav={nav}
              />
            ) : (
              <p className="p-10 text-center text-sm text-foreground/50">
                This site has no pages.
              </p>
            )}
          </div>
        </div>

        {/* Chat sidebar */}
        <aside className="hidden w-80 shrink-0 border-l border-foreground/10 lg:block">
          <ChatSidebar
            siteId={siteId}
            page={selectedPage}
            onPatched={applyPageContent}
            onThemePatch={applyThemePatch}
          />
        </aside>
      </div>

      {showDomain && (
        <CustomDomainPanel
          siteId={siteId}
          initialDomain={customDomain}
          initialVerified={customDomainVerified}
          onClose={() => setShowDomain(false)}
        />
      )}

      {/* Mobile AI assistant (full-screen sheet) */}
      {showChatMobile && (
        <div className="fixed inset-0 z-40 flex flex-col bg-background lg:hidden">
          <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-3">
            <span className="text-sm font-medium">AI assistant</span>
            <button
              onClick={() => setShowChatMobile(false)}
              className="rounded-md border border-foreground/15 px-3 py-1.5 text-sm hover:bg-foreground/5"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <ChatSidebar
              siteId={siteId}
              page={selectedPage}
              onPatched={applyPageContent}
              onThemePatch={applyThemePatch}
            />
          </div>
        </div>
      )}
    </div>
  );
}
