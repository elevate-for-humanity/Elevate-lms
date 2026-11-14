-- Restores only the upload MIME configuration. Existing files are retained.
update storage.buckets
set allowed_mime_types = array_remove(allowed_mime_types, 'application/json')
where id = 'course_videos' and public = false
  and file_size_limit = 1073741824
  and allowed_mime_types = array['video/mp4','video/webm','video/quicktime','image/jpeg','image/png','image/webp','application/json']::text[]
returning id, public, allowed_mime_types, file_size_limit;
