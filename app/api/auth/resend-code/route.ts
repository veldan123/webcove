import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isResendConfigured } from "@/lib/resend";
import { sendVerificationCodeEmail } from "@/lib/email";
import { generateCode, storeCode } from "@/lib/verification";

const schema = z.object({ email: z.string().email() });

// Re-sends a fresh code for an unconfirmed account.
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const { email } = parsed.data;

  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: "Email delivery isn't configured." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const user = list.users.find(
    (u) => (u.email || "").toLowerCase() === email.toLowerCase()
  );
  // Don't reveal whether the account exists; only send for unconfirmed users.
  if (user && !user.email_confirmed_at) {
    const code = generateCode();
    await storeCode(email, user.id, code);
    const name = (user.user_metadata?.full_name as string | undefined) || undefined;
    await sendVerificationCodeEmail(email, code, name);
  }

  return NextResponse.json({ ok: true });
}
