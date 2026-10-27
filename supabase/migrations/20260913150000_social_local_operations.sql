-- Canonical, provider-neutral social/local operations foundation.
-- External writes remain approval gated; tokens stay in social_media_settings.

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  legal_name text not null,
  public_name text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  region text not null,
  postal_code text not null,
  country_code text not null default 'US',
  phone text not null,
  website_url text not null,
  public_email text,
  hours jsonb not null default '{}'::jsonb,
  categories text[] not null default '{}',
  service_areas text[] not null default '{}',
  description text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','pending','verified','rejected')),
  canonical_location_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.business_profiles (
  slug, legal_name, public_name, address_line_1, address_line_2, city, region,
  postal_code, phone, website_url, public_email, categories, service_areas
) values (
  'elevate-for-humanity', '2Exclusive LLC-S, DBA Elevate for Humanity',
  'Elevate for Humanity Career & Technical Institute', '120 E Market St',
  'Suite 930', 'Indianapolis', 'IN', '46204', '(317) 314-3757',
  'https://www.elevateforhumanity.org', 'info@elevateforhumanity.org',
  array['Career and technical education','Workforce development'], array['Indianapolis','Indiana']
)
on conflict (slug) do update set
  legal_name = excluded.legal_name,
  public_name = excluded.public_name,
  address_line_1 = excluded.address_line_1,
  address_line_2 = excluded.address_line_2,
  city = excluded.city,
  region = excluded.region,
  postal_code = excluded.postal_code,
  phone = excluded.phone,
  website_url = excluded.website_url,
  public_email = excluded.public_email,
  updated_at = now();

alter table public.social_media_settings
  add column if not exists granted_scopes text[] not null default '{}',
  add column if not exists connection_status text not null default 'unverified',
  add column if not exists last_verified_at timestamptz,
  add column if not exists refresh_status text,
  add column if not exists dry_run boolean not null default true;

alter table public.social_media_posts
  add column if not exists approval_state text not null default 'pending',
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists scheduled_at timestamptz,
  add column if not exists claim_expires_at timestamptz,
  add column if not exists max_attempts integer not null default 6,
  add column if not exists dead_lettered_at timestamptz,
  add column if not exists cta jsonb not null default '{}'::jsonb,
  add column if not exists media_refs jsonb not null default '[]'::jsonb;

-- Provider identifiers are opaque strings (for example Meta returns page_post),
-- not Elevate UUIDs. Preserve any legacy UUID values through a text cast.
alter table public.social_media_posts
  alter column platform_post_id type text using platform_post_id::text;

alter table public.social_media_posts drop constraint if exists social_media_posts_destination_type_check;
alter table public.social_media_posts add constraint social_media_posts_destination_type_check
  check (destination_type is null or destination_type in (
    'facebook_page','facebook_personal_draft','instagram_image','instagram_reel',
    'google_business_post','google_business_photo','youtube_video','youtube_short',
    'linkedin_organization'
  ));

alter table public.social_media_posts drop constraint if exists social_media_posts_status_check;
alter table public.social_media_posts add constraint social_media_posts_status_check
  check (status in (
    'draft','pending_approval','approved','scheduled','queued','generating','manual_ready',
    'publishing','published','failed','dead_letter','posted','configuration_required'
  ));

alter table public.social_media_posts drop constraint if exists social_media_posts_approval_state_check;
alter table public.social_media_posts add constraint social_media_posts_approval_state_check
  check (approval_state in ('pending','approved','rejected','not_required'));

create index if not exists idx_social_media_posts_due
  on public.social_media_posts (status, scheduled_at, next_attempt_at)
  where status in ('scheduled','queued','failed');

create or replace function public.queue_blog_social_publications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  version_key text;
  approved_image text;
begin
  if new.published is not true or coalesce(new.share_to_social, true) is not true then
    return new;
  end if;

  approved_image := coalesce(new.featured_image, new.image);
  version_key := md5(concat_ws('|', new.title, new.slug, new.excerpt, new.content,
    approved_image, new.social_post_caption, new.updated_at::text));

  insert into public.social_media_posts (
    platform, title, content, status, approval_state, approved_at,
    source_type, source_id, destination_type, post_type, link_url, media_url,
    thumbnail_url, content_version, idempotency_key, scheduled_at,
    next_attempt_at, created_at, updated_at
  ) values
  (
    'facebook', new.title, coalesce(new.excerpt, ''), 'pending_approval', 'pending', null,
    'blog_post', new.id, 'facebook_page', 'blog_link', '/blog/' || new.slug,
    approved_image, approved_image, version_key,
    'blog:' || new.id || ':facebook_page:' || version_key, now(), now(), now(), now()
  ),
  (
    'facebook', new.title, coalesce(new.excerpt, ''), 'pending_approval', 'pending', null,
    'blog_post', new.id, 'facebook_personal_draft', 'reel_draft', '/blog/' || new.slug,
    approved_image, approved_image, version_key,
    'blog:' || new.id || ':facebook_personal_draft:' || version_key, now(), now(), now(), now()
  )
  on conflict (idempotency_key) where idempotency_key is not null do nothing;

  if approved_image is not null and approved_image ~ '^https://' then
    insert into public.social_media_posts (
      platform, title, content, status, approval_state, approved_at,
      source_type, source_id, destination_type, post_type, link_url, media_url,
      thumbnail_url, content_version, idempotency_key, scheduled_at,
      next_attempt_at, created_at, updated_at
    ) values (
      'instagram', new.title, coalesce(new.excerpt, ''), 'pending_approval', 'pending', null,
      'blog_post', new.id, 'instagram_image', 'image', '/blog/' || new.slug,
      approved_image, approved_image, version_key,
      'blog:' || new.id || ':instagram_image:' || version_key, now(), now(), now(), now()
    ) on conflict (idempotency_key) where idempotency_key is not null do nothing;
  end if;

  return new;
end;
$$;

create table if not exists public.business_reviews (
  id uuid primary key default gen_random_uuid(),
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  platform text not null,
  external_review_id text not null,
  author_display_name text,
  rating numeric(2,1) check (rating between 1 and 5),
  review_text text,
  published_at timestamptz,
  synchronized_at timestamptz not null default now(),
  reply_state text not null default 'none'
    check (reply_state in ('none','draft','pending_approval','approved','published','rejected','failed')),
  reply_text text,
  external_reply_id text,
  moderation_state text not null default 'unreviewed',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, external_review_id)
);

create table if not exists public.listing_status (
  id uuid primary key default gen_random_uuid(),
  business_profile_id uuid not null references public.business_profiles(id) on delete cascade,
  directory text not null,
  listing_url text,
  claimed_status text not null default 'unknown',
  verification_status text not null default 'unknown',
  detected_name text,
  detected_address text,
  detected_phone text,
  discrepancy_type text[] not null default '{}',
  correction_status text not null default 'not_started',
  last_checked_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  manual_action_required boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_profile_id, directory)
);

insert into public.listing_status (business_profile_id, directory, correction_status, manual_action_required, notes)
select bp.id, d.directory, 'not_started', true, d.notes
from public.business_profiles bp
cross join (values
  ('Google Business Profile', 'Semrush scan reported the canonical Elevate listing with no detected issue.'),
  ('Facebook', 'Confirm the existing Elevate Page; do not create a duplicate.'),
  ('Bing Places', 'Import or claim the canonical Elevate location.'),
  ('Apple Business Connect', 'Claim the canonical Elevate location.'),
  ('Yelp', 'Do not claim or edit Prestige Elevation Barber & Beauty Institute; it is unrelated.')
) as d(directory, notes)
where bp.slug = 'elevate-for-humanity'
on conflict (business_profile_id, directory) do nothing;

create or replace function public.claim_due_social_posts(p_claim_token uuid, p_limit integer default 5)
returns setof public.social_media_posts
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with due as (
    select id
    from public.social_media_posts
    where status in ('queued','scheduled','failed')
      and approval_state in ('approved','not_required')
      and coalesce(scheduled_at, now()) <= now()
      and coalesce(next_attempt_at, now()) <= now()
      and attempt_count < max_attempts
      and (claim_expires_at is null or claim_expires_at <= now())
    order by coalesce(scheduled_at, created_at), created_at
    for update skip locked
    limit greatest(1, least(p_limit, 25))
  )
  update public.social_media_posts p
  set status = 'generating',
      claim_token = p_claim_token,
      claimed_at = now(),
      claim_expires_at = now() + interval '10 minutes',
      updated_at = now()
  from due
  where p.id = due.id
  returning p.*;
end;
$$;

revoke all on function public.claim_due_social_posts(uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_due_social_posts(uuid, integer) to service_role;

alter table public.business_profiles enable row level security;
alter table public.business_reviews enable row level security;
alter table public.listing_status enable row level security;

drop policy if exists business_profiles_admin_manage on public.business_profiles;
create policy business_profiles_admin_manage on public.business_profiles for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin','staff')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin','staff')));

drop policy if exists business_reviews_admin_manage on public.business_reviews;
create policy business_reviews_admin_manage on public.business_reviews for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin','staff')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin','staff')));

drop policy if exists listing_status_admin_manage on public.listing_status;
create policy listing_status_admin_manage on public.listing_status for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin','staff')))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','super_admin','staff')));

comment on table public.business_profiles is 'Canonical Elevate-owned business identity for first-party and external publishing.';
comment on table public.business_reviews is 'Verified external reviews and approval-gated replies; never a source for fabricated ratings.';
comment on table public.listing_status is 'Evidence-backed directory status; unsupported directories remain explicit manual tasks.';
