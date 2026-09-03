-- Governed visual assets for course heroes, modules, lessons, and sales pages.
create table if not exists public.course_visual_assets (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  placement text not null check (placement in ('hero','module','lesson','sales')),
  media_type text not null check (media_type in ('video','image','animation')),
  asset_url text not null,
  poster_url text,
  alt_text text not null,
  caption text,
  sort_order integer not null default 0,
  is_active boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, placement, sort_order)
);

create index if not exists course_visual_assets_course_active_idx
  on public.course_visual_assets(course_id, is_active, placement, sort_order);

alter table public.course_visual_assets enable row level security;

-- The learner course route requires table-level SELECT in addition to RLS.
-- Anonymous visitors receive no grant; signed-in users still see only rows
-- allowed by the active-visual policy below.
grant select on table public.course_visual_assets to authenticated;

drop policy if exists "Public can read active course visuals" on public.course_visual_assets;
create policy "Public can read active course visuals"
  on public.course_visual_assets for select
  to anon, authenticated
  using (is_active = true);

insert into public.course_visual_assets
  (course_id, placement, media_type, asset_url, poster_url, alt_text, caption, sort_order, is_active, metadata)
select c.id, 'hero', 'video', '/videos/courses/elevate-esb-hero.mp4',
       '/images/pages/entrepreneurship.webp',
       'Entrepreneur presenting a small-business startup plan',
       'Elevate for Humanity Entrepreneurship and Small Business course',
       0, true,
       jsonb_build_object(
         'autoplay', true,
         'muted', true,
         'loop', true,
         'brand', 'Elevate for Humanity',
         'cta_label', 'Start Elevate ESB'
       )
from public.courses c
where c.slug in ('entrepreneurship','cert-prep-esb-us-v2','cert-prep-esb-universal')
on conflict (course_id, placement, sort_order) do update
set media_type = excluded.media_type,
    asset_url = excluded.asset_url,
    poster_url = excluded.poster_url,
    alt_text = excluded.alt_text,
    caption = excluded.caption,
    is_active = excluded.is_active,
    metadata = excluded.metadata,
    updated_at = now();
