-- Generated opening stills are rendered from licensed Envato video clips.
-- Keep them in the canonical public course-videos bucket beside the finished
-- lesson film, narration, captions, and transcript.
update storage.buckets
set allowed_mime_types = (
  select array_agg(distinct mime order by mime)
  from unnest(
    coalesce(allowed_mime_types, array[]::text[])
    || array['image/jpeg', 'image/png', 'image/webp']::text[]
  ) as mime
)
where id = 'course-videos';
