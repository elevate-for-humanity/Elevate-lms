alter table public.page_views
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists landing_path text;

create index if not exists page_views_created_at_idx on public.page_views(created_at desc);
create index if not exists page_views_path_created_at_idx on public.page_views(path, created_at desc);
create index if not exists page_views_session_created_at_idx on public.page_views(session_id, created_at desc);
create index if not exists page_views_utm_source_created_at_idx on public.page_views(utm_source, created_at desc);
