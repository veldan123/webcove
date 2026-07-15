import Link from "next/link";
import { PLAN_LIMITS } from "@/lib/plans";
import { LiquidBackground } from "@/components/home/LiquidBackground";
import { ScrollFx } from "@/components/home/ScrollFx";

const STEPS = [
  {
    n: "1",
    title: "Describe your business",
    body: "Fill in a short form — your name, what you do, and how to reach you. That's it.",
  },
  {
    n: "2",
    title: "AI builds your site",
    body: "Claude writes the copy, structures the pages, and picks a palette that fits your brand.",
  },
  {
    n: "3",
    title: "Refine & publish",
    body: "Tweak anything by chatting with the AI, preview live, then publish to a public URL.",
  },
];

const PLAN_ORDER = [
  { key: "basic" as const, name: "Basic", blurb: "For a single simple site." },
  { key: "pro" as const, name: "Pro", blurb: "More pages, same clean flow." },
  {
    key: "agency" as const,
    name: "Agency",
    blurb: "Publish many sites + cold-email tool.",
  },
];

const FAQS = [
  {
    q: "Do I need to know how to code?",
    a: "No. You describe your business in plain English; the AI writes the copy, structures the pages, and designs the layout. Editing is a chat conversation, not a code editor.",
  },
  {
    q: "Is generating a site really free?",
    a: "Yes — creating and previewing sites costs nothing, and you can refine them by chat as much as you like. A plan is only needed when you press Publish to put a site live on a public URL.",
  },
  {
    q: "Can I change things after the AI builds it?",
    a: "Absolutely. Tell the AI editor things like “make the headline punchier” or “add a testimonials section” and watch the preview update in place.",
  },
  {
    q: "What happens if I cancel my plan?",
    a: "Your sites and drafts stay in your account. Published sites need an active plan to stay live, but nothing is deleted.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <LiquidBackground />
      <ScrollFx />

      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" className="h-7 w-7" />
          Webcove
        </span>
        <nav className="flex items-center gap-3 text-sm">
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
            Get started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 text-center sm:pt-24">
          <p
            data-reveal
            className="mb-4 inline-block rounded-full border border-primary/25 bg-primary-soft px-3 py-1 text-xs font-medium text-primary"
          >
            AI website builder for small businesses
          </p>
          <h1
            data-reveal
            style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
            className="text-balance text-4xl font-bold tracking-tight sm:text-6xl"
          >
            Your whole website,{" "}
            <span className="text-primary">written and designed by AI.</span>
          </h1>
          <p
            data-reveal
            style={{ "--reveal-delay": "160ms" } as React.CSSProperties}
            className="mx-auto mt-6 max-w-xl text-lg text-foreground/70"
          >
            Describe your business in a short form. Webcove generates the copy,
            pages, and design. Preview it, refine it by chat, and publish it
            live in minutes.
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
              Sign in with Google
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-lg border border-foreground/15 px-6 py-3 font-medium transition hover:border-primary/40 hover:text-primary sm:w-auto"
            >
              See pricing
            </Link>
          </div>
          <p
            data-reveal
            style={{ "--reveal-delay": "320ms" } as React.CSSProperties}
            className="mt-4 text-sm text-foreground/50"
          >
            Generating and previewing is free. You only need a plan to publish.
          </p>
        </section>

        {/* Product mock — a generated site inside a browser frame */}
        <section className="mx-auto max-w-4xl px-6 pb-20">
          <div
            data-reveal
            className="overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-2xl shadow-primary/10"
          >
            <div className="flex items-center gap-2 border-b border-foreground/10 bg-foreground/[0.03] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-400/80" />
              <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
              <span className="h-3 w-3 rounded-full bg-green-400/80" />
              <span className="ml-3 flex-1 truncate rounded-md bg-foreground/[0.06] px-3 py-1 text-xs text-foreground/50">
                webcove.app/brew-haven
              </span>
            </div>
            <div className="bg-[#fffaf5] px-8 py-12 text-center text-[#2b2320]">
              <p className="text-2xl font-bold sm:text-3xl">
                Your neighborhood coffee, done right.
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm opacity-70">
                Specialty espresso, fresh pastries, and a warm seat waiting for
                you on Maple Street.
              </p>
              <span className="mt-6 inline-block rounded-lg bg-[#6f4e37] px-5 py-2.5 text-sm font-medium text-white">
                See the menu
              </span>
              <div className="mx-auto mt-10 grid max-w-2xl gap-4 text-left sm:grid-cols-3">
                {["Single-origin beans", "Baked daily", "Work-friendly"].map(
                  (t) => (
                    <div
                      key={t}
                      className="rounded-lg border border-[#2b2320]/10 p-4"
                    >
                      <div className="mb-2 h-1.5 w-8 rounded-full bg-[#c8a06a]" />
                      <p className="text-sm font-semibold">{t}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          <p
            data-reveal
            className="mt-4 text-center text-sm text-foreground/50"
          >
            A real site generated from four form fields — theme, copy, and
            layout included.
          </p>
        </section>

        {/* How it works — a genuine 3-step sequence */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 data-reveal className="text-center text-2xl font-semibold tracking-tight">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                data-reveal
                style={{ "--reveal-delay": `${i * 110}ms` } as React.CSSProperties}
                className="rounded-xl border border-foreground/10 bg-background/60 p-6 backdrop-blur-sm transition hover:border-primary/30"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-foreground/70">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Edit by chat */}
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-16 md:grid-cols-2">
          <div data-reveal>
            <h2 className="text-2xl font-semibold tracking-tight">
              Edit your site by talking to it
            </h2>
            <p className="mt-4 text-foreground/70">
              No page builders, no drag-and-drop grids. Tell the AI editor what
              you want changed and watch the live preview update — headline
              rewrites, new sections, tone changes, anything.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground/75">
              {[
                "Rewrites copy in your voice",
                "Adds or removes whole sections",
                "Keeps everything else untouched",
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
              Perfect. Now make the about page sound more formal
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-foreground/[0.07] px-4 py-2.5 text-sm">
              Rewrote the about copy in a more professional tone.
            </div>
          </div>
        </section>

        {/* Publish strip */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div
            data-reveal
            className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-primary/20 bg-primary-soft px-8 py-10 text-center sm:flex-row sm:text-left"
          >
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                One click from draft to live
              </h2>
              <p className="mt-2 max-w-md text-sm text-foreground/70">
                Press Publish and your site is on a public URL instantly —
                hosting, rendering, and updates handled for you.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 rounded-lg bg-primary px-6 py-3 font-medium text-white shadow-md shadow-primary/25 transition hover:-translate-y-0.5 hover:bg-primary-strong"
            >
              Build your site free
            </Link>
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <h2 data-reveal className="text-center text-2xl font-semibold tracking-tight">
            Simple pricing
          </h2>
          <p data-reveal className="mt-2 text-center text-sm text-foreground/60">
            Free to build. Pick a plan when you&apos;re ready to go live.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PLAN_ORDER.map((p, i) => {
              const limits = PLAN_LIMITS[p.key];
              const featured = p.key === "pro";
              return (
                <div
                  key={p.key}
                  data-reveal
                  style={{ "--reveal-delay": `${i * 110}ms` } as React.CSSProperties}
                  className={`flex flex-col rounded-xl border bg-background/60 p-6 backdrop-blur-sm ${
                    featured
                      ? "border-primary/50 shadow-lg shadow-primary/10"
                      : "border-foreground/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{p.name}</h3>
                    {featured && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-white">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground/60">{p.blurb}</p>
                  <div className="mt-4 text-3xl font-bold">
                    ${limits.priceUsd}
                    <span className="text-base font-normal text-foreground/50">
                      /mo
                    </span>
                  </div>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-foreground/70">
                    <li>Up to {limits.maxPagesPerSite} pages per site</li>
                    <li>
                      {limits.maxPublishedSites === null
                        ? `${limits.monthlyPublishQuota} publishes / month`
                        : `${limits.maxPublishedSites} published site`}
                    </li>
                    {limits.emailTool && <li>Cold-email outreach tool</li>}
                  </ul>
                  <Link
                    href="/pricing"
                    className={`mt-6 rounded-lg px-4 py-2 text-center text-sm font-medium transition ${
                      featured
                        ? "bg-primary text-white hover:bg-primary-strong"
                        : "border border-foreground/15 hover:border-primary/40 hover:text-primary"
                    }`}
                  >
                    Choose {p.name}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-2xl px-6 py-16">
          <h2 data-reveal className="text-center text-2xl font-semibold tracking-tight">
            Questions, answered
          </h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f, i) => (
              <details
                key={f.q}
                data-reveal
                style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
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

        {/* Final CTA — drenched */}
        <section className="px-6 py-20">
          <div
            data-reveal
            className="mx-auto max-w-4xl rounded-3xl bg-primary px-8 py-16 text-center text-white shadow-xl shadow-primary/25"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your website is one form away.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/85">
              Describe your business, watch the AI build it, publish when
              you&apos;re happy. Start free — no card needed to generate.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-block rounded-lg bg-white px-8 py-3.5 font-semibold text-primary-strong transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Get started free
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-10 text-sm text-foreground/50">
        © {new Date().getFullYear()} Webcove. Built with Next.js, Supabase,
        Stripe & Claude.
      </footer>
    </div>
  );
}
