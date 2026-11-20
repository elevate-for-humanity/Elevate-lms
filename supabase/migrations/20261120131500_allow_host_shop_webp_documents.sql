-- Match the Host Shop document upload form and API's existing WebP support.
update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'image/webp')
where id = 'partner-documents'
  and allowed_mime_types is not null
  and not ('image/webp' = any(allowed_mime_types));
