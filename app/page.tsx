import Link from "next/link";
import { PLAN_LIMITS } from "@/lib/plans";

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

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Nav */}
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-semibold tracking-tight">Webcove</span>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/pricing"
            className="rounded-md px-3 py-2 text-foreground/70 hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-foreground px-4 py-2 font-medium text-background hover:opacity-90"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pb-16 pt-16 text-center sm:pt-24">
          <p className="mb-4 inline-block rounded-full border border-foreground/15 px-3 py-1 text-xs font-medium text-foreground/60">
            AI website builder for small businesses
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            Your whole website, written and designed by AI.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/70">
            Describe your business in a short form. Webcove generates the copy,
            pages, and design. Preview it, refine it by chat, and publish it live
            in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="w-full rounded-lg bg-foreground px-6 py-3 font-medium text-background hover:opacity-90 sm:w-auto"
            >
              Sign in with Google
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-lg border border-foreground/15 px-6 py-3 font-medium hover:bg-foreground/5 sm:w-auto"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-foreground/50">
            Generating and previewing is free. You only need a plan to publish.
          </p>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            How it works
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-foreground/10 p-6"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                  {s.n}
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-foreground/70">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing preview */}
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Simple pricing
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {PLAN_ORDER.map((p) => {
              const limits = PLAN_LIMITS[p.key];
              return (
                <div
                  key={p.key}
                  className="flex flex-col rounded-xl border border-foreground/10 p-6"
                >
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-foreground/60">{p.blurb}</p>
                  <div className="mt-4 text-3xl font-bold">
                    ${limits.priceUsd}
                    <span className="text-base font-normal text-foreground/50">
                      /mo
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-foreground/70">
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
                    className="mt-6 rounded-lg border border-foreground/15 px-4 py-2 text-center text-sm font-medium hover:bg-foreground/5"
                  >
                    Choose {p.name}
                  </Link>
                </div>
              );
            })}
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
