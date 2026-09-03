-- Canonical blog -> social draft integration.
-- Published blog posts flagged share_to_social are materialized as reviewable
-- drafts for every configured social platform. External publishing remains
-- gated by account activation/tokens and a separate queue/publisher step.

create or replace function public.sync_blog_post_to_social_drafts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  account record;
  caption text;
begin
  if coalesce(new.published, false) is not true or coalesce(new.share_to_social, false) is not true then
    return new;
  end if;

  caption := coalesce(
    nullif(new.social_post_caption, ''),
    trim(
      new.title ||
      case when nullif(new.excerpt, '') is not null then E'\n\n' || new.excerpt else '' end ||
      E'\n\nhttps://www.elevateforhumanity.org/blog/' || new.slug
    )
  );

  for account in
    select distinct sma.platform
    from public.social_media_accounts sma
  loop
    if not exists (
      select 1
      from public.social_media_posts smp
      where smp.blog_post_id = new.id
        and smp.platform = account.platform
        and coalesce(smp.status, 'draft') in ('draft', 'queued', 'scheduled')
    ) then
      insert into public.social_media_posts (
        platform,
        post_type,
        title,
        content,
        media_url,
        blog_post_id,
        status
      ) values (
        account.platform,
        'blog',
        new.title,
        caption,
        coalesce(new.image, new.featured_image),
        new.id,
        'draft'
      );
    end if;
  end loop;

  return new;
end;
$$;

-- This function is trigger-only. Do not expose it through Supabase RPC.
revoke all on function public.sync_blog_post_to_social_drafts() from public;
revoke execute on function public.sync_blog_post_to_social_drafts() from anon;
revoke execute on function public.sync_blog_post_to_social_drafts() from authenticated;

drop trigger if exists trg_blog_post_social_drafts on public.blog_posts;
create trigger trg_blog_post_social_drafts
after insert or update of published, share_to_social, title, excerpt, slug,
  social_post_caption, image, featured_image
on public.blog_posts
for each row
execute function public.sync_blog_post_to_social_drafts();

-- Backfill existing published articles that were already marked for social sharing.
insert into public.social_media_posts (
  platform,
  post_type,
  title,
  content,
  media_url,
  blog_post_id,
  status
)
select
  sma.platform,
  'blog',
  bp.title,
  coalesce(
    nullif(bp.social_post_caption, ''),
    trim(
      bp.title ||
      case when nullif(bp.excerpt, '') is not null then E'\n\n' || bp.excerpt else '' end ||
      E'\n\nhttps://www.elevateforhumanity.org/blog/' || bp.slug
    )
  ),
  coalesce(bp.image, bp.featured_image),
  bp.id,
  'draft'
from public.blog_posts bp
cross join (select distinct platform from public.social_media_accounts) sma
where coalesce(bp.published, false) = true
  and coalesce(bp.share_to_social, false) = true
  and not exists (
    select 1
    from public.social_media_posts smp
    where smp.blog_post_id = bp.id
      and smp.platform = sma.platform
      and coalesce(smp.status, 'draft') in ('draft', 'queued', 'scheduled')
  );
