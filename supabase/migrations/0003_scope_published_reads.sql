-- Harden the "anyone can read published sites" policies so they apply ONLY to
-- the anonymous role (used by the public site pages). Logged-in users then only
-- ever see their OWN sites/pages, never another user's published ones.

drop policy if exists sites_select_published on public.sites;
create policy sites_select_published on public.sites
  for select to anon using (published = true);

drop policy if exists pages_select_published on public.pages;
create policy pages_select_published on public.pages
  for select to anon using (
    exists (
      select 1 from public.sites s
      where s.id = pages.site_id and s.published = true
    )
  );
