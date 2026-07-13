import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { PLAN_LABELS } from "@/lib/plans";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUserAndProfile();
  // proxy.ts already redirects signed-out users; this is a defense-in-depth
  // check that also guarantees a profile row exists.
  if (!session) redirect("/login?redirect=/dashboard");

  const { profile, email } = session;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-foreground/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            Webcove
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden rounded-full border border-foreground/15 px-3 py-1 text-xs text-foreground/70 sm:inline">
              {PLAN_LABELS[profile.plan]}
              {profile.plan !== "none" &&
                ` · ${profile.subscription_status}`}
            </span>
            {profile.plan === "agency" && (
              <Link
                href="/dashboard/email"
                className="text-foreground/70 hover:text-foreground"
              >
                Email tool
              </Link>
            )}
            <Link
              href="/pricing"
              className="text-foreground/70 hover:text-foreground"
            >
              Plans
            </Link>
            <span className="hidden text-foreground/40 sm:inline">{email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-md border border-foreground/15 px-3 py-1.5 hover:bg-foreground/5">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
