import { createClient } from "@supabase/supabase-js";

/**
 * Cookie-free anon client for reading PUBLIC data (published sites/pages).
 * RLS still applies — only rows with published = true are visible. Not tied to
 * a user session, so public pages don't opt out of caching via cookies().
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
