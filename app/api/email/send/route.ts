import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserAndProfile } from "@/lib/auth";
import { getPlanLimits } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { getResend, fromAddress } from "@/lib/resend";

const bodySchema = z.object({
  recipientEmail: z.string().email(),
  recipientBusinessName: z.string().min(1).max(160),
  priceQuoted: z.number().nonnegative(),
  recurringFee: z.number().nonnegative(),
  emailBody: z.string().min(1).max(8000),
  subject: z.string().min(1).max(200).optional(),
  siteId: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  const session = await getUserAndProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Re-verify Agency access server-side.
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
  const input = parsed.data;
  const subject =
    input.subject?.trim() ||
    `A professional website for ${input.recipientBusinessName}`;

  const supabase = await createClient();

  // Send the email.
  let sendFailed = false;
  try {
    const { error } = await getResend().emails.send({
      from: fromAddress(),
      to: input.recipientEmail,
      subject,
      text: input.emailBody,
    });
    if (error) {
      console.error("Resend error:", error);
      sendFailed = true;
    }
  } catch (err) {
    console.error("Resend threw:", err);
    sendFailed = true;
  }

  // Log the campaign either way.
  const { error: logError } = await supabase.from("email_campaigns").insert({
    owner_id: session.userId,
    site_id: input.siteId ?? null,
    recipient_email: input.recipientEmail,
    recipient_business_name: input.recipientBusinessName,
    price_quoted: input.priceQuoted,
    recurring_fee: input.recurringFee,
    generated_email_body: input.emailBody,
    sent_at: sendFailed ? null : new Date().toISOString(),
    status: sendFailed ? "failed" : "sent",
  });
  if (logError) console.error("Failed to log campaign:", logError);

  if (sendFailed) {
    return NextResponse.json(
      { error: "The email could not be sent. Check your Resend configuration." },
      { status: 502 }
    );
  }

  return NextResponse.json({ sent: true });
}
