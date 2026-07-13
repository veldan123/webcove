import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserAndProfile } from "@/lib/auth";
import { getPlanLimits } from "@/lib/plans";
import { EmailTool } from "@/components/EmailTool";

export const dynamic = "force-dynamic";

export default async function EmailToolPage() {
  const session = await getUserAndProfile();
  if (!session) redirect("/login?redirect=/dashboard/email");

  const { profile } = session;
  const hasAccess =
    getPlanLimits(profile.plan).emailTool &&
    profile.subscription_status === "active";

  if (!hasAccess) {
    return (
      <div className="mx-auto w-full max-w-lg px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Cold-email tool
        </h1>
        <p className="mt-3 text-foreground/60">
          The outreach tool is part of the Agency plan. Upgrade to draft and
          send AI-written cold emails to prospects.
        </p>
        <Link
          href="/pricing"
          className="mt-6 inline-block rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
        >
          See Agency plan
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <Link
        href="/dashboard"
        className="text-sm text-foreground/60 hover:text-foreground"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Cold-email outreach
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        Enter a prospect&apos;s details, let AI draft the email, review it, then
        send.
      </p>
      <EmailTool />
    </div>
  );
}
