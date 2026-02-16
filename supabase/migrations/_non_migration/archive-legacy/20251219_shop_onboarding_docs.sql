-- Shop Onboarding Documents and Application
-- Handles shop application intake and document uploads

-- Shop application (intake)
CREATE TABLE IF NOT EXISTS shop_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'IN',
  zip TEXT NOT NULL,
  ein TEXT,
  years_in_business INTEGER,
  licensed_barbers INTEGER,
  agree_supervision BOOLEAN NOT NULL DEFAULT false,
  agree_reporting BOOLEAN NOT NULL DEFAULT false,
  agree_wages BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted | approved | rejected
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Uploaded onboarding documents
CREATE TABLE IF NOT EXISTS shop_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- mou | payroll | workers_comp | business_license | insurance
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shop_applications_status ON shop_applications(status);
CREATE INDEX IF NOT EXISTS idx_shop_applications_email ON shop_applications(email);
CREATE INDEX IF NOT EXISTS idx_shop_documents_shop_id ON shop_documents(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_documents_type ON shop_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_shop_documents_approved ON shop_documents(approved);

-- Comments
COMMENT ON TABLE shop_applications IS 'Shop partner application intake';
COMMENT ON TABLE shop_documents IS 'Uploaded onboarding documents (MOU, payroll, insurance, etc)';
COMMENT ON COLUMN shop_documents.document_type IS 'mou | payroll | workers_comp | business_license | insurance';
