-- Apprentice Document Management System
-- Required documents for DOL RAPIDS and Indiana IPLA compliance

-- Document types required for apprenticeship
CREATE TABLE IF NOT EXISTS apprentice_document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug TEXT NOT NULL,
  document_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT true,
  required_for TEXT DEFAULT 'enrollment', -- enrollment, rapids, state_board, completion
  display_order INT DEFAULT 0,
  accepted_formats TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'],
  max_file_size_mb INT DEFAULT 10,
  expires_after_days INT, -- NULL = never expires
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_slug, document_type)
);

-- Student uploaded documents
CREATE TABLE IF NOT EXISTS apprentice_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES apprentice_document_types(id),
  program_slug TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apprenticeship Agreement/MOU signatures
CREATE TABLE IF NOT EXISTS apprentice_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_slug TEXT NOT NULL,
  agreement_type TEXT NOT NULL, -- 'apprentice_agreement', 'student_handbook', 'mou', 'safety_agreement'
  agreement_version TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  signature_data TEXT, -- Base64 signature image or typed name
  signature_type TEXT DEFAULT 'typed' CHECK (signature_type IN ('typed', 'drawn', 'electronic')),
  full_legal_name TEXT NOT NULL,
  acknowledged_sections JSONB, -- Which sections were acknowledged
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, program_slug, agreement_type)
);

-- Handbook acknowledgment tracking
CREATE TABLE IF NOT EXISTS handbook_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_slug TEXT NOT NULL,
  section_id TEXT NOT NULL,
  section_title TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, program_slug, section_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_apprentice_docs_student ON apprentice_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_docs_status ON apprentice_documents(status);
CREATE INDEX IF NOT EXISTS idx_apprentice_agreements_student ON apprentice_agreements(student_id);
CREATE INDEX IF NOT EXISTS idx_handbook_ack_student ON handbook_acknowledgments(student_id);

-- RLS
ALTER TABLE apprentice_document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE handbook_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Everyone can view document types
CREATE POLICY "Anyone can view document types" ON apprentice_document_types FOR SELECT USING (true);

-- Students can manage their own documents
CREATE POLICY "Students manage own documents" ON apprentice_documents FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Students manage own agreements" ON apprentice_agreements FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "Students manage own acknowledgments" ON handbook_acknowledgments FOR ALL USING (auth.uid() = student_id);

-- Admins can view all
CREATE POLICY "Admins view all documents" ON apprentice_documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins view all agreements" ON apprentice_agreements FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Insert required document types for Barber Apprenticeship
INSERT INTO apprentice_document_types (program_slug, document_type, name, description, required, required_for, display_order) VALUES
-- Identity Documents
('barber-apprenticeship', 'government_id', 'Government-Issued Photo ID', 'Valid driver''s license, state ID, or passport. Must show photo, name, and date of birth.', true, 'enrollment', 1),
('barber-apprenticeship', 'social_security_card', 'Social Security Card', 'Original or copy of Social Security card for RAPIDS registration.', true, 'rapids', 2),
('barber-apprenticeship', 'birth_certificate', 'Birth Certificate or Proof of Age', 'Birth certificate, passport, or other proof you are at least 16 years old.', true, 'enrollment', 3),

-- Education Documents
('barber-apprenticeship', 'high_school_diploma', 'High School Diploma or GED', 'High school diploma, GED certificate, or official transcript showing graduation.', true, 'enrollment', 4),
('barber-apprenticeship', 'prior_training_transcript', 'Prior Training Transcript (if applicable)', 'Transcripts from any prior barber school or training for transfer hour evaluation.', false, 'enrollment', 5),

-- Employment Documents
('barber-apprenticeship', 'work_authorization', 'Work Authorization', 'I-9 eligible documents proving authorization to work in the United States.', true, 'enrollment', 6),
('barber-apprenticeship', 'sponsor_letter', 'Sponsor/Employer Letter', 'Letter from your sponsoring barbershop confirming your apprenticeship placement.', true, 'rapids', 7),

-- Health & Safety
('barber-apprenticeship', 'tb_test', 'TB Test Results', 'Tuberculosis test results (required by some shops and for state licensure).', false, 'state_board', 8),
('barber-apprenticeship', 'hepatitis_vaccination', 'Hepatitis B Vaccination Record', 'Proof of Hepatitis B vaccination or signed declination form.', false, 'enrollment', 9),

-- Background
('barber-apprenticeship', 'background_consent', 'Background Check Consent', 'Signed consent form for background check (required for RAPIDS).', true, 'rapids', 10)
ON CONFLICT (program_slug, document_type) DO NOTHING;

-- Copy for other beauty programs
INSERT INTO apprentice_document_types (program_slug, document_type, name, description, required, required_for, display_order)
SELECT 'cosmetology-apprenticeship', document_type, name, description, required, required_for, display_order
FROM apprentice_document_types WHERE program_slug = 'barber-apprenticeship'
ON CONFLICT (program_slug, document_type) DO NOTHING;

INSERT INTO apprentice_document_types (program_slug, document_type, name, description, required, required_for, display_order)
SELECT 'esthetician-apprenticeship', document_type, name, description, required, required_for, display_order
FROM apprentice_document_types WHERE program_slug = 'barber-apprenticeship'
ON CONFLICT (program_slug, document_type) DO NOTHING;

INSERT INTO apprentice_document_types (program_slug, document_type, name, description, required, required_for, display_order)
SELECT 'nail-technician-apprenticeship', document_type, name, description, required, required_for, display_order
FROM apprentice_document_types WHERE program_slug = 'barber-apprenticeship'
ON CONFLICT (program_slug, document_type) DO NOTHING;
