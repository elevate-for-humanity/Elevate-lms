-- Canonicalize every document stored in a private document bucket.
-- Idempotent: the storage locator index prevents a physical file from being
-- represented more than once in the canonical documents table.

create unique index if not exists documents_storage_locator_unique_idx
on public.documents (
  coalesce(metadata->>'storage_bucket', 'documents'),
  coalesce(nullif(file_path, ''), nullif(storage_path, ''))
)
where coalesce(nullif(file_path, ''), nullif(storage_path, '')) is not null;

update public.documents d
set file_path = o.name,
    storage_path = o.name,
    file_size = least(coalesce((o.metadata->>'size')::bigint, d.file_size, 0), 2147483647)::integer,
    file_size_bytes = least(coalesce((o.metadata->>'size')::bigint, d.file_size_bytes, 0), 2147483647)::integer,
    mime_type = coalesce(o.metadata->>'mimetype', d.mime_type),
    metadata = coalesce(d.metadata, '{}'::jsonb) || jsonb_build_object(
      'storage_bucket', o.bucket_id,
      'storage_path', o.name,
      'storage_object_id', o.id,
      'reconciled_at', now(),
      'reconciled_by', 'document_inventory_v1'
    ),
    updated_at = now()
from storage.objects o
where o.bucket_id = 'documents'
  and d.file_name = 'qa-synthetic-government-id.png'
  and coalesce(d.file_path, d.storage_path, nullif(d.file_url, ''), nullif(d.url, '')) is null
  and split_part(o.name, '/', 1) = coalesce(d.user_id, d.uploaded_by, d.owner_id)::text
  and o.name like '%/' || d.file_name;

with candidates as (
  select o.*,
    case
      when split_part(o.name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        then coalesce(nullif(split_part(o.name, '/', 2), ''), 'legacy_document')
      else coalesce(nullif(split_part(o.name, '/', 1), ''), 'legacy_document')
    end as raw_type
  from storage.objects o
  where o.bucket_id in (
    'documents',
    'provider-documents',
    'program-holder-documents',
    'shop-onboarding',
    'tax-documents'
  )
)
insert into public.documents (
  user_id, uploaded_by, owner_id, owner_type, document_type, file_name,
  file_size, file_size_bytes, file_url, file_path, storage_path, mime_type,
  status, verification_status, verified, title, metadata, created_at, updated_at
)
select
  inferred.profile_id,
  inferred.profile_id,
  inferred.profile_id,
  case
    when c.raw_type = 'templates' then 'system'
    when c.raw_type ilike '%apprentice%' then 'apprentice'
    when c.raw_type ilike '%shop%' or c.raw_type ilike '%salon%' then 'host_shop'
    when c.raw_type ilike '%student%' then 'student'
    else 'application'
  end,
  case
    when regexp_replace(lower(replace(c.raw_type, '-', '_')), '[^a-z0-9_-]', '', 'g') ~ '^[a-z]'
      then left(regexp_replace(lower(replace(c.raw_type, '-', '_')), '[^a-z0-9_-]', '', 'g'), 128)
    else 'legacy_document'
  end,
  regexp_replace(c.name, '^.*/', ''),
  least(coalesce((c.metadata->>'size')::bigint, 0), 2147483647)::integer,
  least(coalesce((c.metadata->>'size')::bigint, 0), 2147483647)::integer,
  '',
  c.name,
  c.name,
  coalesce(c.metadata->>'mimetype', 'application/octet-stream'),
  case when c.raw_type = 'templates' then 'approved' else 'pending_review' end,
  case when c.raw_type = 'templates' then 'verified' else 'pending' end,
  c.raw_type = 'templates',
  regexp_replace(c.name, '^.*/', ''),
  jsonb_build_object(
    'storage_bucket', c.bucket_id,
    'storage_path', c.name,
    'storage_object_id', c.id,
    'legacy_storage_import', true,
    'reconciled_at', now(),
    'reconciled_by', 'document_inventory_v1'
  ),
  c.created_at,
  coalesce(c.updated_at, c.created_at)
from candidates c
left join lateral (
  select p.id as profile_id
  from public.profiles p
  where p.id::text = case
    when split_part(c.name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      then split_part(c.name, '/', 1)
    else null
  end
  limit 1
) inferred on true
where not exists (
  select 1
  from public.documents d
  where coalesce(nullif(d.file_path, ''), nullif(d.storage_path, '')) = c.name
    and coalesce(d.metadata->>'storage_bucket', 'documents') = c.bucket_id
)
on conflict do nothing;
