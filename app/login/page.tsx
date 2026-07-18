"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Email verification step (manual sign-up with a 4-digit code)
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  const supabase = createClient();

  const callbackUrl = () => {
    const base =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    return `${base}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
  };

  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) setError(error.message);
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else window.location.href = redirect;
    } else {
      // Create the account (auto-confirmed) via our server route, then sign in.
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create your account.");
        setLoading(false);
        return;
      }
      if (data.needsVerification) {
        // Show the code-entry step; sign-in happens after verification.
        setVerifying(true);
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else window.location.href = redirect;
    }
    setLoading(false);
  }

  async function verifyCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not verify that code.");
      setLoading(false);
      return;
    }
    // Confirmed — sign in with the password from sign-up.
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    else window.location.href = redirect;
    setLoading(false);
  }

  async function resendCode() {
    setError(null);
    setMessage(null);
    await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setMessage("A new code is on its way.");
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center px-6 py-16">
      <Link
        href="/"
        className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold tracking-tight"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="h-7 w-7" />
        Webcove
      </Link>

      {verifying ? (
        <form onSubmit={verifyCodeSubmit} className="mt-8">
          <h1 className="text-center text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="mt-2 text-center text-sm text-foreground/60">
            We sent a 4-digit code to{" "}
            <span className="font-medium text-foreground/80">{email}</span>.
            Enter it below to finish creating your account.
          </p>
          <input
            inputMode="numeric"
            autoFocus
            maxLength={4}
            required
            placeholder="1234"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            className="mt-6 w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-foreground/40"
          />
          <button
            type="submit"
            disabled={loading || code.length !== 4}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary-strong disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
          {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
          <div className="mt-6 flex items-center justify-between text-sm text-foreground/60">
            <button
              type="button"
              onClick={resendCode}
              className="hover:text-foreground"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => {
                setVerifying(false);
                setCode("");
                setError(null);
                setMessage(null);
              }}
              className="hover:text-foreground"
            >
              ← Back
            </button>
          </div>
        </form>
      ) : (
        <>
          <h1 className="text-center text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h1>
      <p className="mt-2 text-center text-sm text-foreground/60">
        Generate and preview sites for free. Subscribe when you're ready to
        publish.
      </p>

      <button
        onClick={signInWithGoogle}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/15 px-4 py-2.5 font-medium hover:bg-foreground/5"
      >
        <span
          aria-hidden
          className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs text-background"
        >
          G
        </span>
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-foreground/40">
        <span className="h-px flex-1 bg-foreground/10" />
        or
        <span className="h-px flex-1 bg-foreground/10" />
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-3">
        {mode === "signup" && (
          <input
            type="text"
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2.5 outline-none focus:border-foreground/40"
          />
        )}
        <input
          type="email"
          required
          placeholder="you@business.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2.5 outline-none focus:border-foreground/40"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2.5 outline-none focus:border-foreground/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary-strong disabled:opacity-50"
        >
          {loading
            ? "…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      {message && <p className="mt-4 text-sm text-green-600">{message}</p>}

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
          setMessage(null);
        }}
        className="mt-4 w-full py-3 text-center text-sm text-foreground/60 hover:text-foreground"
      >
        {mode === "signin"
          ? "Don't have an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
