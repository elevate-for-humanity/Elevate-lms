-- Drop the FK constraint on document_audit_log.performed_by that blocks
-- document uploads when the user doesn't have a profiles row yet.
-- Run this in the Supabase Dashboard SQL Editor.

ALTER TABLE document_audit_log DROP CONSTRAINT IF EXISTS document_audit_log_performed_by_fkey;
ALTER TABLE document_audit_log ALTER COLUMN performed_by DROP NOT NULL;
