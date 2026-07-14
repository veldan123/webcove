-- Let a customer point their own domain at their published Webcove site.
alter table public.sites
  add column if not exists custom_domain text unique;
alter table public.sites
  add column if not exists custom_domain_verified boolean not null default false;

create index if not exists sites_custom_domain_idx
  on public.sites(custom_domain) where custom_domain is not null;
