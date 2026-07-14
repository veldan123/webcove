import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isResendConfigured } from "@/lib/resend";
import { sendVerificationCodeEmail } from "@/lib/email";
import { generateCode, storeCode } from "@/lib/verification";

// Creates a new account that is immediately usable — no email-confirmation step.
// Uses the service-role admin API to create the user with email_confirm: true,
// then the client signs in with the same password. This gives a normal
// "sign up → you're in" flow regardless of the project's confirmation setting.
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters").max(200),
  name: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: first }, { status: 400 });
  }
  const { email, password, name } = parsed.data;

  const admin = createAdminClient();

  // Create the user UNconfirmed; we confirm after they enter the emailed code.
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: name ? { full_name: name } : {},
  });

  if (error) {
    const alreadyExists =
      /already|registered|exists/i.test(error.message) ||
      (error as { status?: number }).status === 422;
    if (alreadyExists) {
      return NextResponse.json(
        { error: "An account with this email already exists — sign in instead." },
        { status: 409 }
      );
    }
    console.error("Signup failed:", error);
    return NextResponse.json(
      { error: error.message || "Could not create the account." },
      { status: 400 }
    );
  }

  const userId = created.user!.id;

  // If Resend is set up, email a 4-digit code and require verification.
  if (isResendConfigured()) {
    const code = generateCode();
    await storeCode(email, userId, code);
    const { error: sendErr } = await sendVerificationCodeEmail(email, code, name);
    if (!sendErr) {
      return NextResponse.json({ needsVerification: true });
    }
    console.error("Verification email failed, auto-confirming instead:", sendErr);
  }

  // Fallback (Resend not configured or send failed): confirm immediately so
  // sign-up still works, and let the client sign in directly.
  await admin.auth.admin.updateUserById(userId, { email_confirm: true });
  return NextResponse.json({ needsVerification: false });
}
