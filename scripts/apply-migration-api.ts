/**
 * Apply Agreement Migration via Supabase Management API
 * 
 * Usage: npx tsx scripts/apply-migration-api.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MIGRATION_SQL = `
-- Drop and recreate tables
DROP TABLE IF EXISTS license_agreement_acceptances CASCADE;

CREATE TABLE license_agreement_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  agreement_type TEXT NOT NULL,
  document_version TEXT NOT NULL DEFAULT '1.0',
  document_url TEXT,
  
  signer_name TEXT NOT NULL,
  signer_email TEXT NOT NULL,
  auth_email TEXT,
  
  signature_method TEXT NOT NULL DEFAULT 'checkbox',
  signature_typed TEXT,
  signature_data TEXT,
  
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT NOT NULL DEFAULT '0.0.0.0',
  user_agent TEXT NOT NULL DEFAULT 'unknown',
  
  acceptance_context TEXT DEFAULT 'onboarding',
  role_at_signing TEXT,
  organization_id UUID,
  tenant_id UUID,
  program_id UUID,
  
  legal_acknowledgment BOOLEAN NOT NULL DEFAULT TRUE,
  is_immutable BOOLEAN NOT NULL DEFAULT TRUE,
  
  CONSTRAINT unique_user_agreement UNIQUE(user_id, agreement_type, document_version)
);

CREATE INDEX idx_laa_user_id ON license_agreement_acceptances(user_id);
CREATE INDEX idx_laa_agreement_type ON license_agreement_acceptances(agreement_type);
CREATE INDEX idx_laa_accepted_at ON license_agreement_acceptances(accepted_at);

ALTER TABLE license_agreement_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acceptances" 
  ON license_agreement_acceptances FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acceptances" 
  ON license_agreement_acceptances FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all acceptances" 
  ON license_agreement_acceptances FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff', 'super_admin')
    )
  );

DROP TABLE IF EXISTS agreement_versions CASCADE;

CREATE TABLE agreement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_type TEXT NOT NULL UNIQUE,
  current_version TEXT NOT NULL DEFAULT '1.0',
  document_url TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO agreement_versions (agreement_type, current_version, document_url) VALUES
  ('enrollment', '1.0', '/legal/enrollment-agreement'),
  ('handbook', '1.0', '/legal/student-handbook'),
  ('data_sharing', '1.0', '/legal/data-sharing'),
  ('program_holder_mou', '1.0', '/legal/program-holder-mou'),
  ('employer_agreement', '1.0', '/legal/employer-agreement'),
  ('staff_agreement', '1.0', '/legal/staff-agreement'),
  ('mou', '1.0', '/legal/partner-mou'),
  ('ferpa', '1.0', '/legal/ferpa-consent'),
  ('participation', '1.0', '/legal/participation-agreement')
ON CONFLICT (agreement_type) DO NOTHING;

ALTER TABLE agreement_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view versions" 
  ON agreement_versions FOR SELECT 
  USING (true);
`;

async function applyMigration() {
  console.log('🚀 Applying Agreement Compliance Migration...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Extract project ref from URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1];
  if (!projectRef) {
    console.error('❌ Could not extract project ref from URL');
    process.exit(1);
  }

  console.log(`📍 Project: ${projectRef}`);
  console.log(`📍 URL: ${SUPABASE_URL}\n`);

  // Use the SQL API endpoint
  const sqlEndpoint = `${SUPABASE_URL}/rest/v1/rpc/`;
  
  console.log('📋 Migration SQL prepared');
  console.log('   Size:', MIGRATION_SQL.length, 'bytes\n');

  console.log('⚠️  Direct SQL execution via REST API is not supported.');
  console.log('   Please run the migration manually:\n');
  console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql');
  console.log('   2. Paste the following SQL:\n');
  console.log('─'.repeat(60));
  console.log(MIGRATION_SQL);
  console.log('─'.repeat(60));
  console.log('\n   3. Click "Run"\n');

  // Verify current state
  console.log('🔍 Checking current database state...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  // Check if table exists
  const { data: testData, error: testError } = await supabase
    .from('license_agreement_acceptances')
    .select('id')
    .limit(1);

  if (testError) {
    console.log('❌ license_agreement_acceptances table does not exist or has errors');
    console.log('   Error:', testError.message);
  } else {
    console.log('✅ license_agreement_acceptances table exists');
    
    const { count } = await supabase
      .from('license_agreement_acceptances')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Current row count: ${count || 0}`);
  }

  // Check agreement_versions
  const { data: versions, error: versionsError } = await supabase
    .from('agreement_versions')
    .select('agreement_type, current_version');

  if (versionsError) {
    console.log('❌ agreement_versions table does not exist');
  } else {
    console.log('✅ agreement_versions table exists');
    console.log(`   Configured types: ${versions?.length || 0}`);
  }

  console.log('\n');
}

applyMigration();
