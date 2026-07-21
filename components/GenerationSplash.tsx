"use client";

import { useEffect, useState } from "react";

// Roughly how long a full generation takes (model call + images). The bar is
// driven by real elapsed time against this, so it moves at a believable pace
// instead of racing ahead and then freezing.
const EXPECTED_MS = 90_000;

const STEPS: [number, string][] = [
  [0, "Understanding your business…"],
  [14, "Writing your website copy…"],
  [34, "Structuring your pages…"],
  [55, "Choosing colors & a template…"],
  [70, "Finding photos for your site…"],
  [86, "Putting it all together…"],
];

function stepFor(p: number) {
  let label = STEPS[0][1];
  for (const [at, text] of STEPS) if (p >= at) label = text;
  return label;
}

function mmss(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Full-screen loading splash shown while the AI generates a site.
export function GenerationSplash() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - started), 250);
    return () => clearInterval(t);
  }, []);

  // Linear to 90% over the expected time, then a slow honest creep so it never
  // looks stuck — a frozen bar makes people think the site has errored.
  const progress =
    elapsed <= EXPECTED_MS
      ? Math.max(2, (90 * elapsed) / EXPECTED_MS)
      : Math.min(99, 90 + ((elapsed - EXPECTED_MS) / 1000) * 0.05);

  const overdue = elapsed > EXPECTED_MS;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/3 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--glow-a)" }}
        />
        <div
          className="absolute right-1/3 top-1/3 h-64 w-64 translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--glow-b)" }}
        />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="Webcove"
          className="h-16 w-16 motion-safe:animate-pulse"
        />
        <div className="mt-7 h-9 w-9 motion-safe:animate-spin rounded-full border-[3px] border-foreground/15 border-t-primary" />

        <p className="mt-7 text-lg font-medium">{stepFor(progress)}</p>
        <p className="mt-1.5 text-sm text-foreground/50">
          Building your website with AI — this usually takes 1–2 minutes.
        </p>

        <div className="mt-7 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="wc-progress h-full rounded-full bg-primary transition-[width] duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 flex w-full items-center justify-between text-xs text-foreground/45">
          <span>{Math.round(progress)}%</span>
          <span>{mmss(elapsed)} elapsed</span>
        </div>

        <p className="mt-5 text-xs text-foreground/45">
          {overdue
            ? "Almost there — bigger sites take a little longer. Please keep this tab open."
            : "Please keep this tab open while we build it."}
        </p>
      </div>
    </div>
  );
}
