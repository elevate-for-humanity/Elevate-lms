-- Durable licensed-media provenance and lesson matching for the canonical
-- Course Builder. Provider credentials and temporary download URLs are never
-- stored here; those remain in the server-side secret vault/provider API.

create table if not exists public.licensed_media_entitlements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('envato')),
  provider_item_id text not null,
  purchase_code text,
  title text not null,
  item_url text,
  thumbnail_url text,
  category text,
  license_type text,
  purchased_at timestamptz,
  license_document_url text,
  certificate_storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_item_id)
);

create table if not exists public.course_lesson_media_matches (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  entitlement_id uuid not null references public.licensed_media_entitlements(id) on delete restrict,
  media_asset_id uuid references public.media_assets(id) on delete set null,
  course_video_id uuid references public.course_videos(id) on delete set null,
  search_query text not null,
  match_score numeric(5,4) not null check (match_score between 0 and 1),
  match_reasons jsonb not null default '[]'::jsonb,
  status text not null default 'suggested'
    check (status in ('suggested','approved','rejected','attached','failed')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  attached_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, entitlement_id)
);

create index if not exists licensed_media_entitlements_org_provider_idx
  on public.licensed_media_entitlements (org_id, provider, purchased_at desc);
create index if not exists course_lesson_media_matches_course_status_idx
  on public.course_lesson_media_matches (course_id, status, match_score desc);
create index if not exists course_lesson_media_matches_lesson_idx
  on public.course_lesson_media_matches (lesson_id, match_score desc);
create index if not exists course_lesson_media_matches_entitlement_idx
  on public.course_lesson_media_matches (entitlement_id);
create index if not exists course_lesson_media_matches_media_asset_idx
  on public.course_lesson_media_matches (media_asset_id) where media_asset_id is not null;
create index if not exists course_lesson_media_matches_course_video_idx
  on public.course_lesson_media_matches (course_video_id) where course_video_id is not null;
create index if not exists course_lesson_media_matches_approved_by_idx
  on public.course_lesson_media_matches (approved_by) where approved_by is not null;
create index if not exists licensed_media_entitlements_created_by_idx
  on public.licensed_media_entitlements (created_by) where created_by is not null;

alter table public.licensed_media_entitlements enable row level security;
alter table public.course_lesson_media_matches enable row level security;

revoke all on table public.licensed_media_entitlements from anon, authenticated;
revoke all on table public.course_lesson_media_matches from anon, authenticated;
grant all on table public.licensed_media_entitlements to service_role;
grant all on table public.course_lesson_media_matches to service_role;

create policy licensed_media_entitlements_service_role_all
  on public.licensed_media_entitlements for all to service_role
  using (true) with check (true);
create policy course_lesson_media_matches_service_role_all
  on public.course_lesson_media_matches for all to service_role
  using (true) with check (true);

drop trigger if exists licensed_media_entitlements_updated_at on public.licensed_media_entitlements;
create trigger licensed_media_entitlements_updated_at
  before update on public.licensed_media_entitlements
  for each row execute function public.set_updated_at();

drop trigger if exists course_lesson_media_matches_updated_at on public.course_lesson_media_matches;
create trigger course_lesson_media_matches_updated_at
  before update on public.course_lesson_media_matches
  for each row execute function public.set_updated_at();

comment on table public.licensed_media_entitlements is
  'Provider purchase/license evidence available to server-side builders; never stores credentials or expiring download URLs.';
comment on table public.course_lesson_media_matches is
  'Auditable suggested/approved/attached mapping from licensed purchases to canonical course lessons.';
