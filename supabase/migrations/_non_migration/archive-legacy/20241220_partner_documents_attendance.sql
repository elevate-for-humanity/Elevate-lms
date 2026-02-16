-- Partner Documents and Attendance Tables
-- Extends existing shop partner portal with document management and attendance tracking

-- Partner documents (MOU, W9, insurance, licenses, NDA, payroll setup)
CREATE TABLE IF NOT EXISTS partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- mou | w9 | insurance | license | nda | payroll | other
  file_path TEXT NOT NULL, -- Supabase Storage path
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  notes TEXT NULL,
  uploaded_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Partner attendance (weekly hours tracking per student)
CREATE TABLE IF NOT EXISTS partner_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_slug TEXT NOT NULL,
  week_start DATE NOT NULL,
  mon_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  tue_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  wed_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  thu_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  fri_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  sat_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  sun_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  submitted BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NULL,
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(shop_id, student_id, program_slug, week_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_documents_shop ON partner_documents(shop_id);
CREATE INDEX IF NOT EXISTS idx_partner_documents_status ON partner_documents(status);
CREATE INDEX IF NOT EXISTS idx_partner_attendance_shop_week ON partner_attendance(shop_id, week_start);
CREATE INDEX IF NOT EXISTS idx_partner_attendance_student ON partner_attendance(student_id);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION update_partner_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_documents_updated_at
  BEFORE UPDATE ON partner_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_documents_updated_at();

CREATE OR REPLACE FUNCTION update_partner_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_attendance_updated_at
  BEFORE UPDATE ON partner_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_attendance_updated_at();

-- Enable RLS
ALTER TABLE partner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_documents
CREATE POLICY "partner_docs_admin_all"
ON partner_documents FOR ALL
TO public
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "partner_docs_shop_read"
ON partner_documents FOR SELECT
TO public
USING (is_admin() OR is_shop_staff(shop_id));

CREATE POLICY "partner_docs_shop_insert"
ON partner_documents FOR INSERT
TO public
WITH CHECK (is_admin() OR is_shop_staff(shop_id));

-- RLS Policies for partner_attendance
CREATE POLICY "attendance_admin_all"
ON partner_attendance FOR ALL
TO public
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "attendance_shop_read"
ON partner_attendance FOR SELECT
TO public
USING (is_admin() OR is_shop_staff(shop_id) OR student_id = auth.uid());

CREATE POLICY "attendance_shop_upsert"
ON partner_attendance FOR INSERT
TO public
WITH CHECK (is_admin() OR is_shop_staff(shop_id));

CREATE POLICY "attendance_shop_update"
ON partner_attendance FOR UPDATE
TO public
USING (is_admin() OR is_shop_staff(shop_id))
WITH CHECK (is_admin() OR is_shop_staff(shop_id));

-- Comments
COMMENT ON TABLE partner_documents IS 'Partner onboarding documents (MOU, W9, insurance, etc.)';
COMMENT ON TABLE partner_attendance IS 'Weekly attendance hours tracking per student';
