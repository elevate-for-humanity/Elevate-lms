-- Extend signature_documents with PDF template support and field mapping.
-- Extend signatures with captured signature image, generated PDF, and prefill values.

-- signature_documents additions
alter table signature_documents
  add column if not exists pdf_template_url  text,          -- Supabase Storage URL of uploaded PDF template
  add column if not exists field_map         jsonb,         -- [{ name, label, type, x, y, page, width, height, required }]
  add column if not exists doc_type_category text           -- 'grant' | 'enrollment' | 'mou' | 'nda' | 'policy' | 'other'
    check (doc_type_category in ('grant','enrollment','mou','nda','policy','other'));

-- signatures additions
alter table signatures
  add column if not exists signature_data    text,          -- base64 PNG data URL of drawn/typed signature
  add column if not exists signature_type    text           -- 'draw' | 'typed'
    check (signature_type in ('draw','typed')),
  add column if not exists typed_name        text,          -- name as typed (for typed mode)
  add column if not exists pdf_url           text,          -- Supabase Storage URL of completed signed PDF
  add column if not exists field_values      jsonb,         -- { fieldName: value } prefill data
  add column if not exists signed_at         timestamptz default now();

-- Index for fast lookup of signed docs by document
create index if not exists signatures_document_id_idx
  on signatures (document_id);

-- Index for admin view: all signatures for a signer email
create index if not exists signatures_signer_email_idx
  on signatures (signer_email);
