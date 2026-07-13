import { createClient } from "./supabase/server";
import type { ProfileRow } from "./types";

/**
 * Returns the authenticated user and their profile row, or null if signed out.
 * Server-side only. Route handlers and Server Components should call this and
 * re-verify plan/quota against the returned profile — never trust the client.
 */
export async function getUserAndProfile(): Promise<{
  userId: string;
  email: string | undefined;
  profile: ProfileRow;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<ProfileRow>();

  if (!profile) return null;
  return { userId: user.id, email: user.email, profile };
}
