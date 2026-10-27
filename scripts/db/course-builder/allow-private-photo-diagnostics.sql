-- Primary project cuxzzpsyufcewtmicszk. Reversible bucket configuration repair.
-- The renderer saves provider failure diagnostics as JSON alongside its private
-- teaching photographs. Preserve the private access model, all current media
-- MIME types, object data, RLS, and the existing 1 GiB object limit.
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'application/json')
where id = 'course_videos'
  and public = false
  and file_size_limit = 1073741824
  and allowed_mime_types = array['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp']::text[]
returning id, public, allowed_mime_types, file_size_limit;
