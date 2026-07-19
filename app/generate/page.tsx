"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GenerationSplash } from "@/components/GenerationSplash";
import { PENDING_KEY } from "@/components/home/QuickGenerateForm";

// Runs the pending homepage generation. If the visitor isn't signed in yet, the
// generate API returns 401 and we send them to sign up — then they land back
// here and it generates automatically with no extra clicks.
export default function GeneratePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      const raw =
        typeof window !== "undefined"
          ? localStorage.getItem(PENDING_KEY)
          : null;
      if (!raw) {
        router.replace("/dashboard/new");
        return;
      }

      let form: unknown;
      try {
        form = JSON.parse(raw);
      } catch {
        localStorage.removeItem(PENDING_KEY);
        router.replace("/dashboard/new");
        return;
      }

      try {
        const res = await fetch("/api/sites/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        // Not signed in yet → send to sign up, keep the pending details so it
        // resumes here automatically afterwards.
        if (res.status === 401) {
          window.location.href = "/login?redirect=/generate";
          return;
        }

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Something went wrong generating your site.");
          return;
        }

        localStorage.removeItem(PENDING_KEY);
        router.replace(`/dashboard/${data.siteId}`);
      } catch {
        setError("Network error. Please try again.");
      }
    })();
  }, [router]);

  if (error) {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-xl font-semibold">We couldn&apos;t build it</h1>
        <p className="mt-2 text-sm text-foreground/60">{error}</p>
        <Link
          href="/dashboard/new"
          className="mt-6 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-strong"
        >
          Try again
        </Link>
      </div>
    );
  }

  return <GenerationSplash />;
}
