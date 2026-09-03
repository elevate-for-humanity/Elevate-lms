-- Canonical blog -> social publication workflow.
-- Page publishing is automatic; personal profiles receive a manual-ready draft
-- because Meta does not expose a supported personal-profile publishing API.

alter table public.social_media_posts
  add column if not exists source_type text,
  add column if not exists source_id uuid,
  add column if not exists destination_type text,
  add column if not exists destination_id text,
  add column if not exists post_type text,
  add column if not exists caption text,
  add column if not exists hashtags text[] not null default '{}',
  add column if not exists link_url text,
  add column if not exists video_url text,
  add column if not exists thumbnail_url text,
  add column if not exists generation_payload jsonb not null default '{}'::jsonb,
  add column if not exists content_version text,
  add column if not exists idempotency_key text,
  add column if not exists attempt_count integer not null default 0,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists claimed_at timestamptz,
  add column if not exists claim_token uuid,
  add column if not exists published_url text,
  add column if not exists last_error_code text;

alter table public.social_media_posts drop constraint if exists social_media_posts_status_check;
alter table public.social_media_posts add constraint social_media_posts_status_check
  check (status in ('draft','queued','generating','manual_ready','publishing','published','failed','scheduled','posted'));

alter table public.social_media_posts drop constraint if exists social_media_posts_destination_type_check;
alter table public.social_media_posts add constraint social_media_posts_destination_type_check
  check (destination_type is null or destination_type in ('facebook_page','facebook_personal_draft'));

create unique index if not exists uq_social_media_posts_idempotency
  on public.social_media_posts (idempotency_key)
  where idempotency_key is not null;
create index if not exists idx_social_media_posts_claimable
  on public.social_media_posts (status, next_attempt_at, created_at)
  where status in ('queued','failed');
create index if not exists idx_social_media_posts_source
  on public.social_media_posts (source_type, source_id, destination_type);

create or replace function public.queue_blog_social_publications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  version_key text;
begin
  if new.published is not true or coalesce(new.share_to_social, true) is not true then
    return new;
  end if;

  version_key := md5(concat_ws('|', new.title, new.slug, new.excerpt, new.content,
    new.featured_image, new.image, new.social_post_caption, new.updated_at::text));

  insert into public.social_media_posts (
    platform, title, content, status, source_type, source_id,
    destination_type, post_type, link_url, media_url, thumbnail_url,
    content_version, idempotency_key, next_attempt_at, created_at, updated_at
  ) values
  (
    'facebook', new.title, coalesce(new.excerpt, ''), 'queued', 'blog_post', new.id,
    'facebook_page', 'blog_link', '/blog/' || new.slug,
    coalesce(new.featured_image, new.image), coalesce(new.featured_image, new.image),
    version_key, 'blog:' || new.id || ':facebook_page:' || version_key, now(), now(), now()
  ),
  (
    'facebook', new.title, coalesce(new.excerpt, ''), 'queued', 'blog_post', new.id,
    'facebook_personal_draft', 'reel_draft', '/blog/' || new.slug,
    coalesce(new.featured_image, new.image), coalesce(new.featured_image, new.image),
    version_key, 'blog:' || new.id || ':facebook_personal_draft:' || version_key, now(), now(), now()
  )
  on conflict (idempotency_key) where idempotency_key is not null do nothing;

  return new;
end;
$$;

-- Retire the older draft-only path. Leaving both triggers active would create
-- duplicate records and preserve the obsolete social_media_accounts authority.
drop trigger if exists trg_blog_post_social_drafts on public.blog_posts;
drop function if exists public.sync_blog_post_to_social_drafts();

drop trigger if exists trg_blog_social_publications on public.blog_posts;
create trigger trg_blog_social_publications
after insert or update of published, share_to_social, title, slug, excerpt, content,
  featured_image, image, social_post_caption, updated_at
on public.blog_posts
for each row execute function public.queue_blog_social_publications();

revoke all on function public.queue_blog_social_publications() from public, anon, authenticated;
grant execute on function public.queue_blog_social_publications() to service_role;

alter table public.social_media_posts enable row level security;
drop policy if exists "social_posts_admin_manage" on public.social_media_posts;
create policy "social_posts_admin_manage" on public.social_media_posts
for all to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role in ('admin','super_admin','staff')
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role in ('admin','super_admin','staff')
));

comment on table public.social_media_posts is
  'Durable social content generation and publication queue. External publication IDs are real provider responses only.';
