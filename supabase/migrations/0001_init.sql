-- Webcove initial schema: profiles, sites, pages, email_campaigns
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- Row-Level Security is enabled on every table; the service-role key (used only
-- by the Stripe webhook and trusted server code) bypasses RLS.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type plan_t as enum ('none', 'basic', 'pro', 'agency');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status_t as enum ('inactive', 'active', 'past_due', 'canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type campaign_status_t as enum ('draft', 'sent', 'failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  plan plan_t not null default 'none',
  subscription_status subscription_status_t not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  publishes_this_period integer not null default 0,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_stripe_customer_idx
  on public.profiles(stripe_customer_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sites
-- ---------------------------------------------------------------------------
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  business_name text not null,
  business_type text not null,
  business_description text not null,
  contact_info jsonb not null default '{}'::jsonb,
  generated_content jsonb,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sites_owner_idx on public.sites(owner_id);
create index if not exists sites_published_slug_idx
  on public.sites(slug) where published;

drop trigger if exists sites_set_updated_at on public.sites;
create trigger sites_set_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pages (a site has many pages)
-- ---------------------------------------------------------------------------
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  slug text not null,
  title text not null,
  content jsonb not null default '{"sections":[]}'::jsonb,
  "order" integer not null default 0,
  unique (site_id, slug)
);

create index if not exists pages_site_idx on public.pages(site_id);

-- ---------------------------------------------------------------------------
-- email_campaigns (Agency plan only)
-- ---------------------------------------------------------------------------
create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  site_id uuid references public.sites(id) on delete set null,
  recipient_email text not null,
  recipient_business_name text not null,
  price_quoted numeric,
  recurring_fee numeric,
  generated_email_body text not null,
  sent_at timestamptz,
  status campaign_status_t not null default 'draft',
  created_at timestamptz not null default now()
);

create index if not exists email_campaigns_owner_idx
  on public.email_campaigns(owner_id);

-- ---------------------------------------------------------------------------
-- New-user trigger: create a profiles row on first sign-in
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, plan, subscription_status)
  values (new.id, 'none', 'inactive')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Atomic Agency publish-quota increment.
-- Increments publishes_this_period only if still below the monthly cap.
-- Returns true if the increment happened (publish allowed), false if at cap.
-- Called by the publish route via the service-role client, so the profile
-- guard trigger permits the write.
-- ---------------------------------------------------------------------------
create or replace function public.increment_publish_quota(p_user uuid, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  update public.profiles
     set publishes_this_period = publishes_this_period + 1
   where id = p_user
     and publishes_this_period < p_max
  returning true into ok;
  return coalesce(ok, false);
end;
$$;

-- ===========================================================================
-- Row-Level Security
-- ===========================================================================
alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.pages enable row level security;
alter table public.email_campaigns enable row level security;

-- ---- profiles: a user reads/updates only their own row ----
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- (Inserts happen via the security-definer trigger; no client insert policy.)

-- Backstop: billing + quota columns are writable ONLY by the service role
-- (Stripe webhook and the trusted publish route). Even though a user can update
-- their own profile row via RLS, this trigger blocks tampering with plan status
-- or the publish counter from a browser/user session.
create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
as $$
begin
  -- Browser sessions run as the 'authenticated' or 'anon' Postgres role. The
  -- service-role/secret key (webhook + publish route) and SECURITY DEFINER
  -- helpers run as a privileged role. Block only browser sessions from touching
  -- billing/quota columns. This works for both legacy JWT keys and the new
  -- sb_publishable_/sb_secret_ keys (it doesn't depend on JWT claim parsing).
  if current_user in ('authenticated', 'anon') then
    if new.plan is distinct from old.plan
       or new.subscription_status is distinct from old.subscription_status
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.publishes_this_period is distinct from old.publishes_this_period
       or new.current_period_end is distinct from old.current_period_end then
      raise exception 'profile billing/quota columns are read-only for this role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_columns on public.profiles;
create trigger profiles_guard_columns
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- ---- sites: owner-only for CRUD; public can read published sites ----
drop policy if exists sites_select_own on public.sites;
create policy sites_select_own on public.sites
  for select using (auth.uid() = owner_id);

drop policy if exists sites_select_published on public.sites;
create policy sites_select_published on public.sites
  for select using (published = true);

drop policy if exists sites_insert_own on public.sites;
create policy sites_insert_own on public.sites
  for insert with check (auth.uid() = owner_id);

drop policy if exists sites_update_own on public.sites;
create policy sites_update_own on public.sites
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists sites_delete_own on public.sites;
create policy sites_delete_own on public.sites
  for delete using (auth.uid() = owner_id);

-- ---- pages: owner-only via parent site; public can read pages of published sites ----
drop policy if exists pages_select_own on public.pages;
create policy pages_select_own on public.pages
  for select using (
    exists (
      select 1 from public.sites s
      where s.id = pages.site_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists pages_select_published on public.pages;
create policy pages_select_published on public.pages
  for select using (
    exists (
      select 1 from public.sites s
      where s.id = pages.site_id and s.published = true
    )
  );

drop policy if exists pages_insert_own on public.pages;
create policy pages_insert_own on public.pages
  for insert with check (
    exists (
      select 1 from public.sites s
      where s.id = pages.site_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists pages_update_own on public.pages;
create policy pages_update_own on public.pages
  for update using (
    exists (
      select 1 from public.sites s
      where s.id = pages.site_id and s.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.sites s
      where s.id = pages.site_id and s.owner_id = auth.uid()
    )
  );

drop policy if exists pages_delete_own on public.pages;
create policy pages_delete_own on public.pages
  for delete using (
    exists (
      select 1 from public.sites s
      where s.id = pages.site_id and s.owner_id = auth.uid()
    )
  );

-- ---- email_campaigns: owner-only ----
drop policy if exists campaigns_select_own on public.email_campaigns;
create policy campaigns_select_own on public.email_campaigns
  for select using (auth.uid() = owner_id);

drop policy if exists campaigns_insert_own on public.email_campaigns;
create policy campaigns_insert_own on public.email_campaigns
  for insert with check (auth.uid() = owner_id);

drop policy if exists campaigns_update_own on public.email_campaigns;
create policy campaigns_update_own on public.email_campaigns
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
