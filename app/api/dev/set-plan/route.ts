import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isTestAccount } from "@/lib/testers";

const schema = z.object({ plan: z.enum(["none", "basic", "pro", "agency"]) });

/**
 * Test-only: lets a whitelisted account set its own plan WITHOUT paying, so the
 * paid flows (publish, quota, Agency samples, email tool) can be exercised. The
 * whitelist is checked server-side against the authenticated session email — a
 * normal user hitting this route gets 403.
 */
export async function POST(request: Request) {
  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!isTestAccount(session.email)) {
    return NextResponse.json(
      { error: "This is only available for test accounts." },
      { status: 403 }
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  const { plan } = parsed.data;

  const admin = createAdminClient();
  const patch =
    plan === "none"
      ? { plan, subscription_status: "inactive" as const }
      : {
          plan,
          subscription_status: "active" as const,
          publishes_this_period: 0, // fresh quota for testing
        };

  const { error } = await admin
    .from("profiles")
    .update(patch)
    .eq("id", session.userId);

  if (error) {
    console.error("set-plan failed:", error);
    return NextResponse.json(
      { error: "Could not set the plan." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, plan });
}
