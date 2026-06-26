/**
 * Apply Agreement Migration via Direct SQL
 *
 * Usage: npx tsx scripts/apply-migration-direct.ts
 */

import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL!;

async function applyMigration() {
  console.log('🚀 Applying Agreement Compliance Migration...\n');

  if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Drop and recreate tables
    console.log('📝 Creating license_agreement_acceptances table...');

    await client.query(`
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
    `);
    console.log('   ✅ Table created');

    // Create indexes
    console.log('📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_laa_user_id ON license_agreement_acceptances(user_id);
      CREATE INDEX IF NOT EXISTS idx_laa_agreement_type ON license_agreement_acceptances(agreement_type);
      CREATE INDEX IF NOT EXISTS idx_laa_accepted_at ON license_agreement_acceptances(accepted_at);
    `);
    console.log('   ✅ Indexes created');

    // Enable RLS
    console.log('📝 Enabling RLS...');
    await client.query(`
      ALTER TABLE license_agreement_acceptances ENABLE ROW LEVEL SECURITY;
    `);
    console.log('   ✅ RLS enabled');

    // Create RLS policies
    console.log('📝 Creating RLS policies...');

    await client.query(`
      DROP POLICY IF EXISTS "Users can view own acceptances" ON license_agreement_acceptances;
      CREATE POLICY "Users can view own acceptances" 
        ON license_agreement_acceptances FOR SELECT 
        USING (auth.uid() = user_id);
    `);

    await client.query(`
      DROP POLICY IF EXISTS "Users can insert own acceptances" ON license_agreement_acceptances;
      CREATE POLICY "Users can insert own acceptances" 
        ON license_agreement_acceptances FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    `);

    await client.query(`
      DROP POLICY IF EXISTS "Staff can view all acceptances" ON license_agreement_acceptances;
      CREATE POLICY "Staff can view all acceptances" 
        ON license_agreement_acceptances FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff', 'admin')
          )
        );
    `);

    await client.query(`
      DROP POLICY IF EXISTS "No updates allowed" ON license_agreement_acceptances;
      CREATE POLICY "No updates allowed" 
        ON license_agreement_acceptances FOR UPDATE 
        USING (false);
    `);

    await client.query(`
      DROP POLICY IF EXISTS "No deletes allowed" ON license_agreement_acceptances;
      CREATE POLICY "No deletes allowed" 
        ON license_agreement_acceptances FOR DELETE 
        USING (false);
    `);
    console.log('   ✅ RLS policies created');

    // Create agreement_versions table
    console.log('📝 Creating agreement_versions table...');
    await client.query(`
      DROP TABLE IF EXISTS agreement_versions CASCADE;
      
      CREATE TABLE agreement_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agreement_type TEXT NOT NULL UNIQUE,
        current_version TEXT NOT NULL DEFAULT '1.0',
        document_url TEXT NOT NULL,
        effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('   ✅ Table created');

    // Seed versions
    console.log('📝 Seeding agreement versions...');
    await client.query(`
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
    `);
    console.log('   ✅ Versions seeded');

    // Enable RLS on agreement_versions
    await client.query(`
      ALTER TABLE agreement_versions ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Anyone can view versions" ON agreement_versions;
      CREATE POLICY "Anyone can view versions" 
        ON agreement_versions FOR SELECT 
        USING (true);
    `);
    console.log('   ✅ RLS enabled on agreement_versions');

    // Verify
    console.log('\n🔍 Verifying migration...');

    const { rows: acceptanceCount } = await client.query(`
      SELECT COUNT(*) as count FROM license_agreement_acceptances;
    `);
    console.log(`   license_agreement_acceptances: ${acceptanceCount[0].count} rows`);

    const { rows: versions } = await client.query(`
      SELECT agreement_type, current_version FROM agreement_versions ORDER BY agreement_type;
    `);
    console.log(`   agreement_versions: ${versions.length} types configured`);
    for (const v of versions) {
      console.log(`     - ${v.agreement_type}: v${v.current_version}`);
    }

    console.log('\n✅ Migration completed successfully!\n');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
