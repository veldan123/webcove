import type { Metadata } from "next";
import Link from "next/link";
import { PLAN_LIMITS } from "@/lib/plans";
import { KEEP_SITE_PRICE_USD } from "@/lib/site-status";
import { LiquidBackground } from "@/components/home/LiquidBackground";
import { ScrollFx } from "@/components/home/ScrollFx";

export const metadata: Metadata = {
  title: "How to make money with Webcove — the complete guide",
  description:
    "A step-by-step guide to building AI websites for local businesses and getting paid. Free to start, no code, sites in minutes.",
};

// ---- small on-brand mock visuals (no external images, always render) ----

function BrowserFrame({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-2xl shadow-primary/10">
      <div className="flex items-center gap-2 border-b border-foreground/10 bg-foreground/[0.03] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-400/80" />
        <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
        <span className="h-3 w-3 rounded-full bg-green-400/80" />
        <span className="ml-3 flex-1 truncate rounded-md bg-foreground/[0.06] px-3 py-1 text-xs text-foreground/50">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}

const STEPS = [
  {
    n: "1",
    title: "Find a local business with a weak (or no) website",
    body: "Plumbers, cafés, salons, cleaners, tutors — search Google Maps in your area. If their site looks dated or they only have a Facebook page, that's your customer.",
  },
  {
    n: "2",
    title: "Generate a full sample site in ~5 minutes",
    body: "Type the business name and what they do. Webcove's AI writes the copy, builds the pages, picks a matching design, and adds real photos. No coding, ever.",
  },
  {
    n: "3",
    title: "Polish it by chatting with the AI",
    body: "Want a punchier headline or a menu section? Just tell the AI editor in plain English and watch the preview update. Add their logo, colours, and contact details.",
  },
  {
    n: "4",
    title: "Publish a 48-hour sample for their approval",
    body: "On the Agency plan you publish a live sample the business can actually visit for 48 hours. It comes down on its own — perfect, pressure-free proof.",
  },
  {
    n: "5",
    title: "Send it with the built-in cold-email tool",
    body: "Webcove drafts a warm, professional outreach email — with your live sample link inside — so the business can click and see their new site immediately.",
  },
  {
    n: "6",
    title: "They approve → you keep it live → you get paid",
    body: `When they say yes, hit “Approved website,” pay a one-time $${KEEP_SITE_PRICE_USD} to keep it live for good, and charge the business your fee. Repeat.`,
  },
];

const TRUST = [
  {
    icon: "🆓",
    title: "Free to build & preview",
    body: "Generating and previewing sites costs nothing. You only pay when you publish — so you can build a client's sample before spending a cent.",
  },
  {
    icon: "🧠",
    title: "Zero coding required",
    body: "You describe the business in plain English. The AI writes, designs, and lays out everything. Edits are a chat, not a code editor.",
  },
  {
    icon: "🔒",
    title: "Nothing gets deleted",
    body: "Your sites and drafts stay in your account. Cancel any time — your work is still there when you come back.",
  },
  {
    icon: "🌐",
    title: "Real hosting & custom domains",
    body: "Approved sites go live on a real public URL, and you can connect the client's own domain. It's a genuine product they own.",
  },
  {
    icon: "💬",
    title: "AI that talks back",
    body: "The editor is a conversation. Ask for changes, add sections, rewrite the tone — the live preview updates instantly.",
  },
  {
    icon: "📈",
    title: "Built for reselling",
    body: "Sample publishing, client approval, and a cold-email outreach tool are built in — the whole agency workflow in one place.",
  },
];

const FAQ = [
  {
    q: "Do I really not need to know how to code?",
    a: "Correct. You never touch code. You answer a short form about the business and the AI produces the whole website — copy, structure, design, and photos. Every edit is done by chatting with the AI.",
  },
  {
    q: "How much can I actually charge a business?",
    a: "That's up to you and your market. Small local businesses commonly pay a few hundred dollars for a simple site, plus optional monthly hosting/updates. You set your own price — Webcove just powers the build.",
  },
  {
    q: "Is generating a site free?",
    a: "Yes. Creating and previewing sites is always free, and you can refine them by chat as much as you like. A plan is only needed when you press Publish to put a site live.",
  },
  {
    q: "What does the Agency plan give me?",
    a: `$${PLAN_LIMITS.agency.priceUsd}/month gets you up to ${PLAN_LIMITS.agency.maxPagesPerSite} pages per site, ${PLAN_LIMITS.agency.monthlyPublishQuota} 48-hour sample publishes per month, the cold-email outreach tool, and the ability to keep any approved site live permanently for a one-time $${KEEP_SITE_PRICE_USD}.`,
  },
  {
    q: "What if a client says no?",
    a: "No problem — the 48-hour sample just expires on its own and comes down automatically. You've spent no money keeping it live, and you move on to the next business.",
  },
  {
    q: "Will the earnings be guaranteed?",
    a: "No — and anyone promising guaranteed income isn't being honest with you. Webcove gives you a fast, professional way to build and sell websites. How much you make depends on how many businesses you reach out to and the prices you set.",
  },
];

export default function GuidePage() {
  const a = PLAN_LIMITS.agency;

  return (
    <div className="relative flex min-h-full flex-col">
      <LiquidBackground />
      <ScrollFx />

      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-7 w-7" />
          Webcove
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link
            href="/"
            className="rounded-md px-3 py-2 text-foreground/70 hover:text-foreground"
          >
            Home
          </Link>
          <Link
            href="/pricing"
            className="rounded-md px-3 py-2 text-foreground/70 hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 font-medium text-white shadow-sm hover:bg-primary-strong"
          >
            Start free
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-6 pb-16 pt-14 text-center sm:pt-20">
          <p
            data-reveal
            className="mb-4 inline-block rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
          >
            The complete money-making guide
          </p>
          <h1
            data-reveal
            style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
            className="text-balance text-4xl font-bold tracking-tight sm:text-6xl"
          >
            Build websites for local businesses.{" "}
            <span className="text-primary">Get paid to press a button.</span>
          </h1>
          <p
            data-reveal
            style={{ "--reveal-delay": "160ms" } as React.CSSProperties}
            className="mx-auto mt-6 max-w-xl text-lg text-foreground/70"
          >
            Thousands of small businesses still have no website — or a bad one.
            Webcove&apos;s AI builds a professional site for any of them in
            minutes. You sell it. This guide shows you exactly how, start to
            finish.
          </p>
          <div
            data-reveal
            style={{ "--reveal-delay": "240ms" } as React.CSSProperties}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/login"
              className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-white shadow-md shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary-strong sm:w-auto"
            >
              Start free — build your first site
            </Link>
            <Link
              href="/"
              className="w-full rounded-lg border border-foreground/15 px-6 py-3 font-medium transition hover:border-primary/40 hover:text-primary sm:w-auto"
            >
              Visit the Webcove home page →
            </Link>
          </div>
          <p
            data-reveal
            style={{ "--reveal-delay": "320ms" } as React.CSSProperties}
            className="mt-4 text-sm text-foreground/50"
          >
            Free to build &amp; preview • No coding • Cancel any time
          </p>
        </section>

        {/* What it looks like — product proof */}
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <div data-reveal>
            <BrowserFrame url="webcove.io/rosies-trattoria">
              <div className="bg-[#fffaf5] px-8 py-12 text-center text-[#2b2320]">
                <span className="inline-block rounded-full bg-[#e7c9a3]/60 px-3 py-1 text-xs font-medium">
                  Family-run since 1994
                </span>
                <p className="mt-4 text-2xl font-bold sm:text-4xl">
                  Rosie&apos;s Trattoria
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm opacity-70">
                  Hand-made pasta, wood-fired pizza, and the warmest little
                  dining room on Maple Street.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <span className="rounded-lg bg-[#6f4e37] px-5 py-2.5 text-sm font-medium text-white">
                    View our menu
                  </span>
                  <span className="rounded-lg border border-[#2b2320]/25 px-5 py-2.5 text-sm font-medium">
                    Reserve a table
                  </span>
                </div>
                <div className="mx-auto mt-10 grid max-w-2xl gap-4 text-left sm:grid-cols-3">
                  {["Fresh pasta daily", "Wood-fired oven", "Family recipes"].map(
                    (t) => (
                      <div
                        key={t}
                        className="rounded-lg border border-[#2b2320]/10 bg-white/60 p-4"
                      >
                        <div className="mb-2 h-1.5 w-8 rounded-full bg-[#c8a06a]" />
                        <p className="text-sm font-semibold">{t}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </BrowserFrame>
          </div>
          <p
            data-reveal
            className="mt-4 text-center text-sm text-foreground/50"
          >
            A real site generated from a few form fields — copy, layout, colours,
            and photos included. This is what your clients get.
          </p>
        </section>

        {/* The money model */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2
            data-reveal
            className="text-center text-3xl font-semibold tracking-tight"
          >
            How the money works
          </h2>
          <p
            data-reveal
            className="mx-auto mt-3 max-w-2xl text-center text-foreground/70"
          >
            You&apos;re the middle-person between a powerful AI builder and a
            business that needs a website. Webcove handles the building and
            hosting. You handle finding the client and setting the price.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[
              {
                k: "You pay Webcove",
                v: `$${a.priceUsd}/mo`,
                d: `Agency plan + a one-time $${KEEP_SITE_PRICE_USD} to keep each approved site live.`,
              },
              {
                k: "You charge the business",
                v: "You decide",
                d: "Small local sites commonly go for a few hundred dollars — you set your own price.",
              },
              {
                k: "Time per site",
                v: "~5 min",
                d: "The AI does the building. Your real work is finding businesses and reaching out.",
              },
            ].map((c, i) => (
              <div
                key={c.k}
                data-reveal
                style={{ "--reveal-delay": `${i * 110}ms` } as React.CSSProperties}
                className="rounded-2xl border border-foreground/10 bg-background/60 p-6 backdrop-blur-sm"
              >
                <p className="text-sm text-foreground/60">{c.k}</p>
                <p className="mt-1 text-3xl font-bold text-primary">{c.v}</p>
                <p className="mt-2 text-sm text-foreground/70">{c.d}</p>
              </div>
            ))}
          </div>

          {/* Illustrative earnings example */}
          <div
            data-reveal
            className="mt-8 overflow-hidden rounded-2xl border border-primary/20 bg-primary-soft p-6 sm:p-8"
          >
            <h3 className="text-lg font-semibold">
              An example month (illustration)
            </h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-3 text-sm">
                {[
                  ["Sell 4 websites at $400 each", "+ $1,600"],
                  [`Keep-live fee (4 × $${KEEP_SITE_PRICE_USD})`, "− $100"],
                  [`Webcove Agency plan`, `− $${a.priceUsd}`],
                ].map(([l, v]) => (
                  <div
                    key={l}
                    className="flex items-center justify-between border-b border-foreground/10 pb-2"
                  >
                    <span className="text-foreground/75">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold">You keep</span>
                  <span className="text-xl font-bold text-primary">
                    ≈ ${(1600 - 4 * KEEP_SITE_PRICE_USD - a.priceUsd).toLocaleString()}
                  </span>
                </div>
              </div>
              {/* simple bar visual */}
              <div className="flex items-end gap-3">
                {[
                  { h: 40, label: "1 site" },
                  { h: 70, label: "2" },
                  { h: 100, label: "4" },
                  { h: 150, label: "8" },
                ].map((b) => (
                  <div key={b.label} className="flex flex-1 flex-col items-center">
                    <div
                      className="w-full rounded-t-md bg-primary/70"
                      style={{ height: `${b.h}px` }}
                    />
                    <span className="mt-1 text-xs text-foreground/50">
                      {b.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-5 text-xs text-foreground/50">
              This is an illustration to show how the numbers add up — not a
              promise. Your results depend on how many businesses you contact and
              the prices you set. Webcove is a tool, not a guaranteed income.
            </p>
          </div>
        </section>

        {/* Step by step with mini visuals */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2
            data-reveal
            className="text-center text-3xl font-semibold tracking-tight"
          >
            The full process, step by step
          </h2>
          <div className="mt-10 space-y-4">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                data-reveal
                style={{ "--reveal-delay": `${(i % 3) * 90}ms` } as React.CSSProperties}
                className="flex items-start gap-5 rounded-2xl border border-foreground/10 bg-background/60 p-6 backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-white">
                  {s.n}
                </div>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-foreground/70">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Edit-by-chat proof */}
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-16 md:grid-cols-2">
          <div data-reveal>
            <h2 className="text-2xl font-semibold tracking-tight">
              You&apos;re always in control
            </h2>
            <p className="mt-4 text-foreground/70">
              Nothing about this is &quot;set it and forget it&quot; magic you
              can&apos;t change. Every site is yours to shape — tell the AI what
              you want and watch it happen, then show the client something
              they&apos;ll be proud of.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground/75">
              {[
                "Rewrite any text in the client's voice",
                "Add or remove whole sections",
                "Drop in their logo, colours, and photos",
                "Connect their own domain name",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div
            data-reveal
            style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
            className="space-y-3 rounded-2xl border border-foreground/10 bg-background/60 p-5 backdrop-blur-sm"
          >
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-white">
              Make the headline punchier and add a testimonials section
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-foreground/[0.07] px-4 py-2.5 text-sm">
              Done — updated the preview.
            </div>
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-white">
              Use their logo I just uploaded, and make the buttons green
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-foreground/[0.07] px-4 py-2.5 text-sm">
              Logo set and buttons updated to green. Anything else?
            </div>
          </div>
        </section>

        {/* Trust grid */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2
            data-reveal
            className="text-center text-3xl font-semibold tracking-tight"
          >
            Why you can trust this
          </h2>
          <p
            data-reveal
            className="mx-auto mt-3 max-w-2xl text-center text-foreground/70"
          >
            No gimmicks. Here&apos;s exactly what Webcove is and how it protects
            you and your clients.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST.map((t, i) => (
              <div
                key={t.title}
                data-reveal
                style={{ "--reveal-delay": `${(i % 3) * 90}ms` } as React.CSSProperties}
                className="rounded-2xl border border-foreground/10 bg-background/60 p-6 backdrop-blur-sm"
              >
                <div className="text-2xl">{t.icon}</div>
                <h3 className="mt-3 font-semibold">{t.title}</h3>
                <p className="mt-1.5 text-sm text-foreground/70">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Plans */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2
            data-reveal
            className="text-center text-3xl font-semibold tracking-tight"
          >
            Pick a plan when you&apos;re ready to publish
          </h2>
          <p
            data-reveal
            className="mt-2 text-center text-sm text-foreground/60"
          >
            Building and previewing is always free. To sell websites, the Agency
            plan is the one you want.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {(["basic", "pro", "agency"] as const).map((key, i) => {
              const p = PLAN_LIMITS[key];
              const featured = key === "agency";
              return (
                <div
                  key={key}
                  data-reveal
                  style={{ "--reveal-delay": `${i * 110}ms` } as React.CSSProperties}
                  className={`flex flex-col rounded-2xl border bg-background/60 p-6 backdrop-blur-sm ${
                    featured
                      ? "border-primary/50 shadow-lg shadow-primary/10"
                      : "border-foreground/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold capitalize">{key}</h3>
                    {featured && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-white">
                        For reselling
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-3xl font-bold">
                    ${p.priceUsd}
                    <span className="text-base font-normal text-foreground/50">
                      /mo
                    </span>
                  </div>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-foreground/70">
                    <li>Up to {p.maxPagesPerSite} pages per site</li>
                    <li>
                      {p.monthlyPublishQuota === null
                        ? `${p.maxPublishedSites} published site`
                        : `${p.monthlyPublishQuota} sample publishes / month`}
                    </li>
                    {featured && <li>48-hour client-approval samples</li>}
                    {featured && (
                      <li>Keep an approved site for ${KEEP_SITE_PRICE_USD} one-time</li>
                    )}
                    {p.emailTool && <li>Cold-email outreach tool</li>}
                  </ul>
                  <Link
                    href="/pricing"
                    className={`mt-6 rounded-lg px-4 py-2 text-center text-sm font-medium transition ${
                      featured
                        ? "bg-primary text-white hover:bg-primary-strong"
                        : "border border-foreground/15 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    See {key} plan
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-2xl px-6 py-16">
          <h2
            data-reveal
            className="text-center text-3xl font-semibold tracking-tight"
          >
            Honest answers
          </h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f, i) => (
              <details
                key={f.q}
                data-reveal
                style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}
                className="group rounded-xl border border-foreground/10 bg-background/60 px-5 py-4 backdrop-blur-sm open:border-primary/30"
              >
                <summary className="cursor-pointer list-none font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {f.q}
                    <span className="text-primary transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-20">
          <div
            data-reveal
            className="mx-auto max-w-4xl rounded-3xl bg-primary px-8 py-16 text-center text-white shadow-xl shadow-primary/25"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to build your first one?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/85">
              It&apos;s free to create and preview. Build a sample for a real
              local business today and see how good it looks — you only pay when
              you&apos;re ready to publish.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="w-full rounded-lg bg-white px-8 py-3.5 font-semibold text-primary-strong transition hover:-translate-y-0.5 hover:shadow-lg sm:w-auto"
              >
                Start free
              </Link>
              <Link
                href="/"
                className="w-full rounded-lg border border-white/40 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                Go to Webcove home page
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-foreground/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Webcove</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Start free
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
