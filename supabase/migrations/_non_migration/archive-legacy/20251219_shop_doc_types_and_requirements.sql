-- Shop Document Requirements and Types
-- Defines required documents for shop onboarding with NDA, credentials, licenses

-- Catalog of required docs (configurable without code changes)
CREATE TABLE IF NOT EXISTS shop_document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug TEXT NOT NULL DEFAULT 'barber-apprenticeship',
  state TEXT NOT NULL DEFAULT 'IN',
  document_type TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT true,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_slug, state, document_type)
);

-- Seed Indiana barber requirements
INSERT INTO shop_document_requirements (program_slug, state, document_type, required, display_name, description)
VALUES
  ('barber-apprenticeship', 'IN', 'mou', true, 'Signed MOU', 'Employer/worksite agreement with sponsor'),
  ('barber-apprenticeship', 'IN', 'nda', true, 'Signed NDA + IP Acknowledgment', 'Confidentiality + IP protection for EFH systems'),
  ('barber-apprenticeship', 'IN', 'w9', true, 'W-9', 'Tax form for vendor/payroll setup'),
  ('barber-apprenticeship', 'IN', 'payroll', true, 'Payroll Setup', 'Payroll contact + method + pay schedule confirmation'),
  ('barber-apprenticeship', 'IN', 'shop_license', true, 'Shop License / Registration', 'Proof shop is legally operating'),
  ('barber-apprenticeship', 'IN', 'barber_license', true, 'Supervising Barber License', 'License of supervisor responsible for apprentice'),
  ('barber-apprenticeship', 'IN', 'credentials', false, 'Additional Credentials', 'Any certs required by partner or state'),
  ('barber-apprenticeship', 'IN', 'workers_comp', false, 'Workers Comp', 'Proof of coverage (if required)'),
  ('barber-apprenticeship', 'IN', 'insurance', false, 'General Liability Insurance', 'Proof of coverage (if required)')
ON CONFLICT (program_slug, state, document_type) DO NOTHING;

-- Helper view: required docs + whether uploaded/approved
CREATE OR REPLACE VIEW shop_required_docs_status AS
SELECT
  s.id AS shop_id,
  s.name AS shop_name,
  r.program_slug,
  r.state,
  r.document_type,
  r.display_name,
  r.description,
  r.required,
  COALESCE(d.approved, false) AS approved,
  d.file_url,
  d.uploaded_by,
  d.created_at AS uploaded_at,
  d.approved_by,
  d.approved_at
FROM shops s
CROSS JOIN shop_document_requirements r
LEFT JOIN LATERAL (
  SELECT *
  FROM shop_documents sd
  WHERE sd.shop_id = s.id
    AND sd.document_type = r.document_type
  ORDER BY sd.created_at DESC
  LIMIT 1
) d ON true
WHERE r.state = 'IN'
  AND r.program_slug = 'barber-apprenticeship';

-- Grant access to view
GRANT SELECT ON shop_required_docs_status TO authenticated;

-- Signature tracking (optional but useful)
CREATE TABLE IF NOT EXISTS shop_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- nda | mou | handbook_ack
  signed_by_name TEXT NOT NULL,
  signed_by_title TEXT,
  signed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shop_document_requirements_state ON shop_document_requirements(state);
CREATE INDEX IF NOT EXISTS idx_shop_document_requirements_program ON shop_document_requirements(program_slug);
CREATE INDEX IF NOT EXISTS idx_shop_signatures_shop_id ON shop_signatures(shop_id);

-- Comments
COMMENT ON TABLE shop_document_requirements IS 'Defines required documents for shop onboarding by program and state';
COMMENT ON VIEW shop_required_docs_status IS 'Shows completion status of required documents for each shop';
COMMENT ON TABLE shop_signatures IS 'Tracks signature details for legal documents';
