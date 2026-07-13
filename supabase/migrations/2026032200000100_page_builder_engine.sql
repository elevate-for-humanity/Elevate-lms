-- Page builder engine: database-driven pages and sections
-- Pages are identified by slug; sections reference a registered component name
-- and a props JSON blob. Position controls render order.

create table if not exists pages (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text,
  status      text not null default 'published' check (status in ('published', 'draft', 'archived')),
  meta_title  text,
  meta_desc   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists page_sections (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references pages(id) on delete cascade,
  component  text not null,
  position   integer not null default 0,
  props      jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_page_sections_page_position
  on page_sections(page_id, position);

-- Keep updated_at current automatically
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pages_updated_at
  before update on pages
  for each row execute function touch_updated_at();

create trigger page_sections_updated_at
  before update on page_sections
  for each row execute function touch_updated_at();

-- RLS: public can read published pages; only admin/staff can write
alter table pages enable row level security;
alter table page_sections enable row level security;

create policy "pages_public_read"
  on pages for select
  using (status = 'published');

create policy "pages_admin_all"
  on pages for all
  using (is_admin_role());

create policy "page_sections_public_read"
  on page_sections for select
  using (
    exists (
      select 1 from pages p
      where p.id = page_sections.page_id
        and p.status = 'published'
    )
  );

create policy "page_sections_admin_all"
  on page_sections for all
  using (is_admin_role());
