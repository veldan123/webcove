"use client";

import { useEffect, useState } from "react";

const STEPS = [
  "Understanding your business…",
  "Writing your website copy…",
  "Structuring your pages…",
  "Choosing colors & a template…",
  "Generating images…",
  "Putting it all together…",
];

// Full-screen loading splash shown while the AI generates a site.
export function GenerationSplash() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    const msg = setInterval(
      () => setStep((s) => (s + 1) % STEPS.length),
      3400
    );
    let p = 8;
    const prog = setInterval(() => {
      // Ease toward 92% so it always feels like it's moving but never "finishes"
      // before the real redirect happens.
      p = Math.min(92, p + (92 - p) * 0.05 + 0.5);
      setProgress(p);
    }, 400);
    return () => {
      clearInterval(msg);
      clearInterval(prog);
    };
  }, []);

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

        <p className="mt-7 text-lg font-medium">{STEPS[step]}</p>
        <p className="mt-1.5 text-sm text-foreground/50">
          Building your website with AI — this usually takes 15–30 seconds.
        </p>

        <div className="mt-7 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
