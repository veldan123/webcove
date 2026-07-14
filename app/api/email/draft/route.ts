import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { getPlanLimits } from "@/lib/plans";
import { draftColdEmail } from "@/lib/anthropic";

export const maxDuration = 60;

const bodySchema = z.object({
  recipientBusinessName: z.string().min(1).max(160),
  priceQuoted: z.number().nonnegative(),
  recurringFee: z.number().nonnegative().nullable().optional(),
  recurringPeriod: z.enum(["month", "year"]).optional(),
});

export async function POST(request: Request) {
  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Re-verify Agency access server-side (never trust the client gate).
  const hasAccess =
    getPlanLimits(session.profile.plan).emailTool &&
    session.profile.subscription_status === "active";
  if (!hasAccess) {
    return NextResponse.json(
      { error: "The email tool requires an active Agency plan." },
      { status: 403 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const body = await draftColdEmail(parsed.data);
    return NextResponse.json({ body });
  } catch (err) {
    console.error("Draft cold email failed:", err);
    return NextResponse.json(
      { error: "Could not draft the email. Please try again." },
      { status: 502 }
    );
  }
}
