-- Published sites show a "Built with Webcove" badge by default (free viral
-- marketing). Owners can pay a one-time fee to remove it.
alter table public.sites
  add column if not exists branding_removed boolean not null default false;
