-- Apprentice document upload system
-- Creates apprentice_document_types (required doc definitions per program)
-- and apprentice_documents (per-student upload records with storage path).
-- Seeds Indiana barber apprenticeship required documents.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. apprentice_document_types
--    Defines what documents are required for each program.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.apprentice_document_types (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug        TEXT NOT NULL,
  document_type       TEXT NOT NULL,          -- machine key, e.g. 'government_id'
  name                TEXT NOT NULL,          -- display name
  description         TEXT,
  is_required         BOOLEAN NOT NULL DEFAULT TRUE,
  accepted_formats    TEXT[] NOT NULL DEFAULT ARRAY['pdf','jpg','jpeg','png'],
  max_file_size_mb    INTEGER NOT NULL DEFAULT 10,
  display_order       INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  UNIQUE (program_slug, document_type)
);

ALTER TABLE public.apprentice_document_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doc_types_public_read" ON public.apprentice_document_types
  FOR SELECT USING (true);

CREATE POLICY "doc_types_admin_write" ON public.apprentice_document_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. apprentice_documents
--    One row per uploaded file per student per document type.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.apprentice_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type_id    UUID REFERENCES public.apprentice_document_types(id),
  program_slug        TEXT NOT NULL DEFAULT 'barber-apprenticeship',
  document_type       TEXT NOT NULL,          -- denormalized for fast queries
  file_name           TEXT NOT NULL,
  file_path           TEXT NOT NULL,          -- Supabase Storage path (bucket-relative)
  file_url            TEXT,                   -- deprecated; kept for backward compat
  file_size_bytes     INTEGER,
  mime_type           TEXT,
  status              TEXT NOT NULL DEFAULT 'pending',
                      CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  rejection_reason    TEXT,
  reviewed_by         UUID REFERENCES auth.users(id),
  reviewed_at         TIMESTAMPTZ,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_apprentice_docs_student
  ON public.apprentice_documents (student_id, program_slug);
CREATE INDEX IF NOT EXISTS idx_apprentice_docs_status
  ON public.apprentice_documents (status);
CREATE INDEX IF NOT EXISTS idx_apprentice_docs_type
  ON public.apprentice_documents (student_id, document_type);

ALTER TABLE public.apprentice_documents ENABLE ROW LEVEL SECURITY;

-- Students see only their own documents
CREATE POLICY "apprentice_docs_student_select"
  ON public.apprentice_documents FOR SELECT
  USING (auth.uid() = student_id);

-- Students insert their own documents
CREATE POLICY "apprentice_docs_student_insert"
  ON public.apprentice_documents FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can delete their own pending/rejected documents
CREATE POLICY "apprentice_docs_student_delete"
  ON public.apprentice_documents FOR DELETE
  USING (auth.uid() = student_id AND status IN ('pending', 'rejected'));

-- Admins/staff manage all
CREATE POLICY "apprentice_docs_admin_all"
  ON public.apprentice_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

COMMENT ON COLUMN public.apprentice_documents.file_path IS
  'Supabase Storage path relative to the documents bucket. Use storage.createSignedUrl() to generate download URLs.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Seed: Indiana barber apprenticeship required documents
--    Based on Indiana PLA + DOL RAPIDS enrollment requirements
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.apprentice_document_types
  (program_slug, document_type, name, description, is_required, accepted_formats, max_file_size_mb, display_order)
VALUES
  ('barber-apprenticeship', 'government_id',
   'Government-Issued Photo ID',
   'Valid driver''s license, state ID, or passport. Must show full name, date of birth, and photo. Expired IDs not accepted.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 1),

  ('barber-apprenticeship', 'social_security_card',
   'Social Security Card or ITIN Letter',
   'Original SSN card or IRS ITIN assignment letter (CP-565). Required for DOL RAPIDS registration. ITIN accepted in place of SSN.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 2),

  ('barber-apprenticeship', 'proof_of_age',
   'Proof of Age (18+)',
   'Birth certificate, passport, or government ID showing date of birth. Must be 18 or older to enroll.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 3),

  ('barber-apprenticeship', 'apprenticeship_agreement',
   'Signed Apprenticeship Agreement',
   'Fully executed apprenticeship agreement signed by apprentice, employer, and Elevate for Humanity. All three signatures required.',
   TRUE, ARRAY['pdf'], 20, 4),

  ('barber-apprenticeship', 'employer_verification',
   'Employer Verification / Offer Letter',
   'Letter from host barbershop confirming employment, wage rate, and start date. Must be on shop letterhead and signed by owner.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 5),

  ('barber-apprenticeship', 'proof_of_address',
   'Proof of Residence',
   'Utility bill, bank statement, or lease agreement dated within 60 days. Must show your name and current address.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 6),

  ('barber-apprenticeship', 'high_school_diploma',
   'High School Diploma or GED',
   'Copy of diploma, GED certificate, or official transcript showing graduation. Required for Indiana PLA barber license eligibility.',
   TRUE, ARRAY['pdf','jpg','jpeg','png'], 10, 7),

  ('barber-apprenticeship', 'transfer_hours_documentation',
   'Transfer Hours Documentation (if applicable)',
   'Official transcript or letter from prior barber school or apprenticeship program documenting hours completed. Only required if claiming transfer hours.',
   FALSE, ARRAY['pdf','jpg','jpeg','png'], 20, 8),

  ('barber-apprenticeship', 'itin_documentation',
   'ITIN Documentation (if no SSN)',
   'IRS CP-565 ITIN assignment letter. Required only if you do not have a Social Security Number.',
   FALSE, ARRAY['pdf','jpg','jpeg','png'], 10, 9)

ON CONFLICT (program_slug, document_type) DO UPDATE
  SET name        = EXCLUDED.name,
      description = EXCLUDED.description,
      display_order = EXCLUDED.display_order;
