-- 4-digit email verification codes for manual (email/password) sign-ups.
-- Only the service role touches this table (RLS on, no policies).

create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code text not null,
  user_id uuid references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed boolean not null default false,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists evc_email_idx
  on public.email_verification_codes(email) where not consumed;

alter table public.email_verification_codes enable row level security;
-- No policies: only the service-role key (server code) can read/write.
