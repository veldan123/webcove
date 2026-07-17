-- Agency plan reworked into a "48-hour sample" model.
--
-- Agency users publish a SAMPLE site for the client to review. It goes live for
-- 48 hours (publish_expires_at) and comes down automatically. Once the client
-- approves, the agency clicks "Approved website" and pays a one-time fee to
-- KEEP it live permanently (kept = true, publish_expires_at cleared).
alter table public.sites
  add column if not exists publish_expires_at timestamptz;
alter table public.sites
  add column if not exists kept boolean not null default false;

-- Helps the (optional) sweep of expired samples and general lookups.
create index if not exists sites_publish_expires_at_idx
  on public.sites(publish_expires_at) where publish_expires_at is not null;
