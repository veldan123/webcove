import "server-only";
import { createAdminClient } from "./supabase/admin";

const CODE_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;

export function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000)); // 1000–9999
}

interface CodeRow {
  id: string;
  code: string;
  user_id: string | null;
  expires_at: string;
  consumed: boolean;
  attempts: number;
}

/** Invalidates prior codes for the email and stores a fresh one. */
export async function storeCode(email: string, userId: string, code: string) {
  const admin = createAdminClient();
  const e = email.toLowerCase();
  await admin
    .from("email_verification_codes")
    .update({ consumed: true })
    .eq("email", e)
    .eq("consumed", false);
  await admin.from("email_verification_codes").insert({
    email: e,
    user_id: userId,
    code,
    expires_at: new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString(),
  });
}

/** Checks a submitted code; consumes it on success. */
export async function verifyCode(
  email: string,
  code: string
): Promise<{ ok: boolean; error?: string; userId?: string | null }> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("email_verification_codes")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<CodeRow>();

  if (!row) return { ok: false, error: "No pending code — request a new one." };
  if (new Date(row.expires_at) < new Date())
    return { ok: false, error: "That code expired. Request a new one." };
  if (row.attempts >= MAX_ATTEMPTS)
    return { ok: false, error: "Too many attempts. Request a new code." };

  if (row.code !== code.trim()) {
    await admin
      .from("email_verification_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    return { ok: false, error: "Incorrect code. Try again." };
  }

  await admin
    .from("email_verification_codes")
    .update({ consumed: true })
    .eq("id", row.id);
  return { ok: true, userId: row.user_id };
}
