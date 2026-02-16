-- Shop Partner Portal Tables
-- Enables barbershops to log in, view apprentices, and submit weekly reports

-- Shops (employer locations)
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ein TEXT,
  address1 TEXT,
  address2 TEXT,
  city TEXT,
  state TEXT NOT NULL DEFAULT 'IN',
  zip TEXT,
  phone TEXT,
  email TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shop staff accounts (links a logged-in user to a shop)
CREATE TABLE IF NOT EXISTS shop_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'manager', -- manager | supervisor
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shop_id, user_id)
);

-- Apprentice placements (ties student to shop + start/end)
CREATE TABLE IF NOT EXISTS apprentice_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_slug TEXT NOT NULL DEFAULT 'barber-apprenticeship',
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  supervisor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active', -- active | paused | completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, shop_id, program_slug)
);

-- Weekly hours & attendance reporting
CREATE TABLE IF NOT EXISTS apprentice_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id UUID NOT NULL REFERENCES apprentice_placements(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  hours_total NUMERIC(6,2) NOT NULL DEFAULT 0,
  hours_ojt NUMERIC(6,2) NOT NULL DEFAULT 0,
  hours_related NUMERIC(6,2) NOT NULL DEFAULT 0,
  attendance_notes TEXT,
  competencies_notes TEXT,
  submitted_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted | approved | rejected
  sponsor_review_notes TEXT,
  sponsor_reviewed_at TIMESTAMPTZ,
  sponsor_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (placement_id, week_start, week_end)
);

-- Wage progression reporting
CREATE TABLE IF NOT EXISTS apprentice_wage_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id UUID NOT NULL REFERENCES apprentice_placements(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  hourly_wage NUMERIC(8,2) NOT NULL,
  note TEXT,
  submitted_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Shop onboarding checklist
CREATE TABLE IF NOT EXISTS shop_onboarding (
  shop_id UUID PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
  handbook_ack BOOLEAN NOT NULL DEFAULT false,
  reporting_trained BOOLEAN NOT NULL DEFAULT false,
  apprentice_supervisor_assigned BOOLEAN NOT NULL DEFAULT false,
  rapids_reporting_ready BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shop_staff_user_id ON shop_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_staff_shop_id ON shop_staff(shop_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_placements_student_id ON apprentice_placements(student_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_placements_shop_id ON apprentice_placements(shop_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_placements_status ON apprentice_placements(status);
CREATE INDEX IF NOT EXISTS idx_apprentice_weekly_reports_placement_id ON apprentice_weekly_reports(placement_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_weekly_reports_status ON apprentice_weekly_reports(status);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION update_shops_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shops_updated_at
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION update_shops_updated_at();

CREATE OR REPLACE FUNCTION update_apprentice_placements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_apprentice_placements_updated_at
  BEFORE UPDATE ON apprentice_placements
  FOR EACH ROW
  EXECUTE FUNCTION update_apprentice_placements_updated_at();

CREATE OR REPLACE FUNCTION set_shop_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_shop_onboarding_updated_at
  BEFORE UPDATE ON shop_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION set_shop_onboarding_updated_at();

-- Comments for audit trail
COMMENT ON TABLE shops IS 'Barbershop employer locations for apprentice placements';
COMMENT ON TABLE shop_staff IS 'Links user accounts to shops for portal access';
COMMENT ON TABLE apprentice_placements IS 'Assigns students to shops for OJT';
COMMENT ON TABLE apprentice_weekly_reports IS 'Weekly hours and attendance submitted by shops';
COMMENT ON TABLE apprentice_wage_updates IS 'Wage progression tracking for RAPIDS compliance';
COMMENT ON TABLE shop_onboarding IS 'Shop partner onboarding checklist';
