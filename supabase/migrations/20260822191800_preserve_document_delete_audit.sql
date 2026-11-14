-- Audit records must outlive deleted documents. A foreign key back to documents
-- makes the AFTER DELETE audit trigger fail because the parent row is already gone.
-- Keep document_id as the immutable historical identifier, but remove the live-row FK.

alter table public.document_audit_log
  drop constraint if exists document_audit_log_document_id_fkey;

create index if not exists idx_document_audit_log_document_id
  on public.document_audit_log(document_id);
