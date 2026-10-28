-- Preserve the private bucket and its current permissions. Extend only accepted curriculum formats.
update storage.buckets
set allowed_mime_types = array(select distinct mime from unnest(allowed_mime_types || array[
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv'
]) as mime)
where id = 'documents' and allowed_mime_types is not null;

-- An in-flight exit report is one review request per holder/enrollment, even under concurrent submission.
-- Existing duplicates intentionally prevent migration until reconciled; never delete report evidence.
create unique index if not exists program_holder_testing_report_in_review
on public.program_holder_reports (program_holder_id, (metadata->>'enrollment_id'))
where report_type = 'general' and metadata->>'report_kind' = 'testing_readiness'
  and status in ('submitted', 'under_review');
