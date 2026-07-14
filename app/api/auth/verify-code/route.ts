import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCode } from "@/lib/verification";

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{4}$/, "Enter the 4-digit code"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email, code } = parsed.data;

  const result = await verifyCode(email, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Mark the user's email confirmed so they can sign in.
  if (result.userId) {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(result.userId, {
      email_confirm: true,
    });
    if (error) {
      console.error("Failed to confirm user after code:", error);
      return NextResponse.json(
        { error: "Could not confirm your account. Try again." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
