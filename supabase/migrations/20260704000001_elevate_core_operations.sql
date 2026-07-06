-- ============================================================
-- Elevate Core Operations Tables
-- Purpose: SOPs, Employees, Testing, Apprenticeships, Binders, Communications, Partners, Store
-- ============================================================

-- SOP Templates
CREATE TABLE IF NOT EXISTS sop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('admissions', 'enrollment', 'testing', 'instructor_duties', 'apprenticeship', 'workone', 'voc_rehab', 'grants', 'billing', 'compliance')),
  description TEXT,
  content JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth/users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOP Assignments
CREATE TABLE IF NOT EXISTS sop_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID NOT NULL REFERENCES sop_templates(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id),
  assigned_by UUID REFERENCES auth.users(id),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'overdue')),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees (extends auth.users)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  department TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Tasks
CREATE TABLE IF NOT EXISTS employee_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  due_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testing Sessions
CREATE TABLE IF NOT EXISTS testing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id),
  student_name TEXT,
  vendor TEXT NOT NULL CHECK (vendor IN ('act_workkeys', 'certiport', 'hsi', 'epa_hvac', 'hiset_hse', 'other')),
  exam_name TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'failed')),
  score DECIMAL(5,2),
  passing_score DECIMAL(5,2),
  proctor_id UUID REFERENCES auth.users(id),
  notes TEXT,
  score_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apprentice Records
CREATE TABLE IF NOT EXISTS apprentice_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id),
  student_name TEXT,
  program_id UUID,
  employer_id UUID,
  employer_name TEXT,
  mentor_name TEXT,
  ojl_hours_required INTEGER DEFAULT 2000,
  ojl_hours_completed INTEGER DEFAULT 0,
  rti_hours_required INTEGER DEFAULT 144,
  rti_hours_completed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'withdrawn')),
  rapids_enrollment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apprentice Skills
CREATE TABLE IF NOT EXISTS apprentice_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id UUID NOT NULL REFERENCES apprentice_records(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  competency_area TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'approved')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Binder Documents
CREATE TABLE IF NOT EXISTS student_binder_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('application', 'enrollment_agreement', 'id_document', 'funding_documents', 'attendance', 'progress_reports', 'certificates', 'testing_scores', 'apprenticeship_docs', 'case_notes', 'other')),
  title TEXT NOT NULL,
  file_url TEXT,
  status TEXT NOT NULL DEFAULT 'missing' CHECK (status IN ('missing', 'uploaded', 'approved', 'rejected')),
  uploaded_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication Messages
CREATE TABLE IF NOT EXISTS communication_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES auth.users(id),
  recipient_email TEXT,
  recipient_phone TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed', 'cancelled')),
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner Accounts
CREATE TABLE IF NOT EXISTS partner_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  partner_type TEXT NOT NULL CHECK (partner_type IN ('employer', 'barber_shop', 'school', 'agency', 'other')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store Products
CREATE TABLE IF NOT EXISTS store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  product_type TEXT NOT NULL CHECK (product_type IN ('course', 'kit', 'retail', 'subscription')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  image_url TEXT,
  inventory_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sop_templates_category ON sop_templates(category);
CREATE INDEX IF NOT EXISTS idx_sop_templates_status ON sop_templates(status);
CREATE INDEX IF NOT EXISTS idx_sop_assignments_sop_id ON sop_assignments(sop_id);
CREATE INDEX IF NOT EXISTS idx_sop_assignments_assigned_to ON sop_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employee_tasks_employee_id ON employee_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_testing_sessions_student_id ON testing_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_testing_sessions_scheduled ON testing_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_apprentice_records_student_id ON apprentice_records(student_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_skills_apprentice_id ON apprentice_skills(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_student_binder_student_id ON student_binder_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_binder_type ON student_binder_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_communication_messages_recipient ON communication_messages(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_communication_messages_status ON communication_messages(status);
CREATE INDEX IF NOT EXISTS idx_partner_accounts_type ON partner_accounts(partner_type);
CREATE INDEX IF NOT EXISTS idx_store_products_type ON store_products(product_type);
CREATE INDEX IF NOT EXISTS idx_store_products_status ON store_products(status);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sop_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE testing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_binder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for all tables
CREATE POLICY "Admin full access sop_templates" ON sop_templates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access sop_assignments" ON sop_assignments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access employees" ON employees FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access employee_tasks" ON employee_tasks FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access testing_sessions" ON testing_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access apprentice_records" ON apprentice_records FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access apprentice_skills" ON apprentice_skills FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access student_binder_documents" ON student_binder_documents FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access communication_messages" ON communication_messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access partner_accounts" ON partner_accounts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admin full access store_products" ON store_products FOR ALL USING (auth.role() = 'service_role');

-- Public read for store products
CREATE POLICY "Public read store_products" ON store_products FOR SELECT USING (status = 'active');

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sop_templates_updated_at BEFORE UPDATE ON sop_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_tasks_updated_at BEFORE UPDATE ON employee_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_testing_sessions_updated_at BEFORE UPDATE ON testing_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_apprentice_records_updated_at BEFORE UPDATE ON apprentice_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_accounts_updated_at BEFORE UPDATE ON partner_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_store_products_updated_at BEFORE UPDATE ON store_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
