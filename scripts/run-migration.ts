/**
 * Run Curriculum Licensing Migration
 * Uses pg package to connect directly to PostgreSQL
 */
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const { Client } = pg;

// Supabase PostgreSQL connection
const DB_URL = 'postgresql://postgres:kingGreene08$$$@db.cuxzzpsyufcewtmicszk.supabase.co:5432/postgres';

async function runMigration() {
  console.log('🚀 Running Curriculum Licensing Migration...\n');

  // Read migration file
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260711000001_curriculum_licensing_tables.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file loaded:', migrationPath);
  console.log('📊 SQL length:', sql.length, 'characters\n');

  // Connect to database
  const client = new Client({
    connectionString: DB_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Split into individual statements
    const statements = sql
      .split(/;\s*\n/g)
      .map(s => s.trim())
      .filter(s => s.length > 10 && !s.startsWith('--'));

    console.log(`📦 ${statements.length} statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      const stmtPreview = stmt.substring(0, 50).replace(/\s+/g, ' ') + '...';

      try {
        await client.query(stmt);
        successCount++;
        console.log(`   ✅ ${i + 1}. ${stmtPreview}`);
      } catch (e: any) {
        errorCount++;
        // Ignore "already exists" errors
        if (e.message.includes('already exists')) {
          console.log(`   ⚠️  ${i + 1}. ${stmtPreview} (already exists)`);
        } else {
          console.log(`   ❌ ${i + 1}. ${e.message.substring(0, 80)}`);
        }
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   ${successCount} succeeded, ${errorCount} errors (expected 0-5 for "already exists")\n`);

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('curricula', 'curriculum_versions', 'curriculum_licenses', 'schools', 'course_factory_jobs', 'readiness_reports', 'blueprint_monitors')
      ORDER BY table_name
    `);

    console.log('\n📋 Tables created:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

  } catch (e) {
    console.error('❌ Connection error:', e);
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
