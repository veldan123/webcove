-- Agency samples get an explicit client decision: approve (pay to keep it live)
-- or reject. A rejected sample still consumed one of the monthly publishes.
alter table public.sites
  add column if not exists rejected boolean not null default false;
