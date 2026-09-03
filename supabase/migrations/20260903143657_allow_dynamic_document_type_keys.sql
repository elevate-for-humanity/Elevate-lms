-- Document requirements are configuration-driven. The former enum-style CHECK
-- on documents.document_type drifted from apprentice_document_types and
-- rejected valid uploads such as employer_verification.
--
-- Keep the database boundary strict without coupling it to a hard-coded list:
-- document type keys must be non-empty, normalized machine identifiers.

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_document_type_check;

ALTER TABLE public.documents
  ADD CONSTRAINT documents_document_type_check
  CHECK (document_type ~ '^[a-z][a-z0-9_-]{0,127}$') NOT VALID;

ALTER TABLE public.documents
  VALIDATE CONSTRAINT documents_document_type_check;

