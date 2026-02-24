-- Migration: Add missing tables referenced in code
-- These tables are needed for full functionality

-- Copilot deployments table
CREATE TABLE IF NOT EXISTS copilot_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  copilot_type TEXT NOT NULL CHECK (copilot_type IN ('ai_tutor', 'admin_assistant', 'support_bot')),
  status TEXT NOT NULL DEFAULT 'deploying' CHECK (status IN ('deploying', 'active', 'stopped', 'failed')),
  config JSONB DEFAULT '{}',
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  deployed_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeclock shifts table
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql] CREATE TABLE IF NOT EXISTS timeclock_shifts (
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql]   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql]   apprentice_id UUID NOT NULL,
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql]   site_id UUID,
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql]   clock_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql]   clock_out_at TIMESTAMPTZ,
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql]   lunch_start_at TIMESTAMPTZ,
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql]   lunch_end_at TIMESTAMPTZ,
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql]   total_hours DECIMAL(5,2),
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql]   notes TEXT,
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql]   created_at TIMESTAMPTZ DEFAULT NOW(),
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql]   updated_at TIMESTAMPTZ DEFAULT NOW()
-- [DUPLICATE: canonical in 20260131000001_timeclock_schema.sql] );
-- If table already exists from 20260131, add the missing column
ALTER TABLE timeclock_shifts ADD COLUMN IF NOT EXISTS notes TEXT;

-- Admin checkout sessions for licensing
CREATE TABLE IF NOT EXISTS admin_checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approved payment links for licensing
CREATE TABLE IF NOT EXISTS approved_payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  product_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization settings for white-label tenants
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Organization roles for white-label tenants
CREATE TABLE IF NOT EXISTS organization_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  role_name TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, role_name)
);

-- OCR extractions log
CREATE TABLE IF NOT EXISTS ocr_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT,
  file_name TEXT,
  file_type TEXT,
  document_type TEXT,
  confidence DECIMAL(3,2),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax appointments
CREATE TABLE IF NOT EXISTS tax_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES auth.users(id),
  appointment_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  preparer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media posts
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  title TEXT,
  content TEXT,
  media_url TEXT,
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'failed')),
  platform_post_id TEXT,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media settings
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql] CREATE TABLE IF NOT EXISTS social_media_settings (
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql]   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql]   platform TEXT NOT NULL UNIQUE,
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql]   access_token TEXT,
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql]   refresh_token TEXT,
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql]   expires_at TIMESTAMPTZ,
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql]   organization_id TEXT,
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql]   organizations JSONB DEFAULT '[]',
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql]   enabled BOOLEAN DEFAULT FALSE,
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql]   created_at TIMESTAMPTZ DEFAULT NOW(),
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql]   updated_at TIMESTAMPTZ DEFAULT NOW()
-- [DUPLICATE: canonical in 20260126000002_create_social_media_settings.sql] );

-- Add user_id column to apprentices if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'apprentices' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE apprentices ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE apprentices ADD COLUMN IF NOT EXISTS user_id UUID;
    CREATE INDEX IF NOT EXISTS idx_apprentices_user_id ON apprentices(user_id);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_copilot_deployments_type_status ON copilot_deployments(copilot_type, status);
ALTER TABLE timeclock_shifts ADD COLUMN IF NOT EXISTS apprentice_id TEXT;
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_apprentice ON timeclock_shifts(apprentice_id);
ALTER TABLE timeclock_shifts ADD COLUMN IF NOT EXISTS apprentice_id TEXT;
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_active ON timeclock_shifts(apprentice_id) WHERE clock_out_at IS NULL;
ALTER TABLE ocr_extractions ADD COLUMN IF NOT EXISTS client_id UUID;
CREATE INDEX IF NOT EXISTS idx_ocr_extractions_client ON ocr_extractions(client_id);
ALTER TABLE tax_appointments ADD COLUMN IF NOT EXISTS scheduled_at TEXT;
CREATE INDEX IF NOT EXISTS idx_tax_appointments_scheduled ON tax_appointments(scheduled_at);
ALTER TABLE social_media_posts ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_social_media_posts_status ON social_media_posts(status);
ALTER TABLE social_media_posts ADD COLUMN IF NOT EXISTS scheduled_for TEXT;
CREATE INDEX IF NOT EXISTS idx_social_media_posts_scheduled ON social_media_posts(scheduled_for) WHERE status = 'scheduled';

-- RLS policies
ALTER TABLE copilot_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeclock_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_settings ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for copilot deployments
DROP POLICY IF EXISTS "Admins can manage copilot deployments" ON copilot_deployments;
CREATE POLICY "Admins can manage copilot deployments" ON copilot_deployments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Apprentices can view their own shifts
DROP POLICY IF EXISTS "Apprentices can view own shifts" ON timeclock_shifts;
CREATE POLICY "Apprentices can view own shifts" ON timeclock_shifts
  FOR SELECT USING (
    apprentice_id IN (
      SELECT id FROM apprentices WHERE user_id = auth.uid()
    )
  );

-- Admins can manage all shifts
DROP POLICY IF EXISTS "Admins can manage shifts" ON timeclock_shifts;
CREATE POLICY "Admins can manage shifts" ON timeclock_shifts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );
