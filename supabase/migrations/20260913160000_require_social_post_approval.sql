update public.social_media_posts
set status = 'pending_approval', approval_state = 'pending', approved_at = null,
    approved_by = null, updated_at = now()
where destination_type in ('facebook_page','instagram_image','instagram_reel')
  and status in ('queued','scheduled','failed')
  and approval_state = 'not_required';

create or replace function public.queue_blog_social_publications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare version_key text; approved_image text;
begin
  if new.published is not true or coalesce(new.share_to_social, true) is not true then return new; end if;
  approved_image := coalesce(new.featured_image, new.image);
  version_key := md5(concat_ws('|', new.title, new.slug, new.excerpt, new.content,
    approved_image, new.social_post_caption, new.updated_at::text));

  insert into public.social_media_posts (
    platform, title, content, status, approval_state, approved_at,
    source_type, source_id, destination_type, post_type, link_url, media_url,
    thumbnail_url, content_version, idempotency_key, scheduled_at,
    next_attempt_at, created_at, updated_at
  ) values
  ('facebook', new.title, coalesce(new.excerpt, ''), 'pending_approval', 'pending', null,
    'blog_post', new.id, 'facebook_page', 'blog_link', '/blog/' || new.slug,
    approved_image, approved_image, version_key,
    'blog:' || new.id || ':facebook_page:' || version_key, null, null, now(), now()),
  ('facebook', new.title, coalesce(new.excerpt, ''), 'queued', 'not_required', now(),
    'blog_post', new.id, 'facebook_personal_draft', 'reel_draft', '/blog/' || new.slug,
    approved_image, approved_image, version_key,
    'blog:' || new.id || ':facebook_personal_draft:' || version_key, now(), now(), now(), now())
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
      'blog:' || new.id || ':instagram_image:' || version_key, null, null, now(), now()
    ) on conflict (idempotency_key) where idempotency_key is not null do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.queue_blog_social_publications() from public, anon, authenticated;
grant execute on function public.queue_blog_social_publications() to service_role;
