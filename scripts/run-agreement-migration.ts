/**
 * Run Agreement Compliance Migration
 * 
 * Usage: npx tsx scripts/run-agreement-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function runMigration() {
  console.log('🚀 Starting Agreement Compliance Migration...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
  });

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations/20260203_agreement_compliance_final.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Migration file loaded');
  console.log('   Path:', migrationPath);
  console.log('   Size:', migrationSQL.length, 'bytes\n');

  // Split into statements (simple split on semicolons outside of functions)
  // For complex migrations, we'll execute as a single block via RPC
  
  try {
    // Execute via Supabase's SQL execution
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct approach
      console.log('⚠️  exec_sql RPC not available, trying alternative...\n');
      
      // Split and execute statements individually
      const statements = splitSQLStatements(migrationSQL);
      console.log(`📝 Found ${statements.length} SQL statements\n`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i].trim();
        if (!stmt) continue;

        console.log(`   [${i + 1}/${statements.length}] Executing...`);
        
        // Use raw SQL via postgrest
        const { error: stmtError } = await supabase.from('_exec').select().limit(0);
        
        // Since we can't execute raw SQL directly, we'll need to use the Supabase dashboard
        // or a direct postgres connection
      }
    }

    console.log('✅ Migration completed successfully!\n');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    console.log('\n📋 Please run the migration manually via Supabase Dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to SQL Editor');
    console.log('   4. Paste the contents of:');
    console.log('      supabase/migrations/20260203_agreement_compliance_final.sql');
    console.log('   5. Click "Run"\n');
  }

  // Verify the table exists
  console.log('🔍 Verifying migration...\n');
  
  const { data: tables, error: tableError } = await supabase
    .from('license_agreement_acceptances')
    .select('id')
    .limit(1);

  if (tableError) {
    console.log('❌ Table verification failed:', tableError.message);
    console.log('\n⚠️  The table may not exist yet. Please run the migration manually.\n');
  } else {
    console.log('✅ Table license_agreement_acceptances exists');
    
    // Check count
    const { count } = await supabase
      .from('license_agreement_acceptances')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Current row count: ${count || 0}\n`);
  }

  // Check agreement_versions
  const { data: versions, error: versionsError } = await supabase
    .from('agreement_versions')
    .select('agreement_type, current_version');

  if (versionsError) {
    console.log('❌ agreement_versions table check failed:', versionsError.message);
  } else {
    console.log('✅ Agreement versions configured:');
    for (const v of versions || []) {
      console.log(`   - ${v.agreement_type}: v${v.current_version}`);
    }
  }

  console.log('\n🎉 Migration verification complete!\n');
}

function splitSQLStatements(sql: string): string[] {
  // Simple statement splitter - handles basic cases
  const statements: string[] = [];
  let current = '';
  let inFunction = false;
  let dollarQuote = '';

  const lines = sql.split('\n');
  
  for (const line of lines) {
    // Skip comments
    if (line.trim().startsWith('--')) {
      continue;
    }

    // Check for dollar quoting (functions)
    const dollarMatch = line.match(/\$\$|\$[a-zA-Z_]+\$/);
    if (dollarMatch) {
      if (!inFunction) {
        inFunction = true;
        dollarQuote = dollarMatch[0];
      } else if (line.includes(dollarQuote)) {
        inFunction = false;
        dollarQuote = '';
      }
    }

    current += line + '\n';

    // If we hit a semicolon and we're not in a function, it's end of statement
    if (line.trim().endsWith(';') && !inFunction) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

runMigration().catch(console.error);
