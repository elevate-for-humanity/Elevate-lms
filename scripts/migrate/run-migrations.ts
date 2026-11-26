/**
 * Database Migration Runner
 * Run all Supabase migrations in order
 * 
 * Usage: npx tsx scripts/migrate/run-migrations.ts   (dry-run by default)
 *        APPLY_MIGRATIONS=true npx tsx scripts/migrate/run-migrations.ts
 *        Production additionally requires APPLY_PRODUCTION=true
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Starter 1e02e5e intent, ported as a gate (not as a file port): dry-run by
// default. Apply only with APPLY_MIGRATIONS=true. Production (the live
// elevate project) additionally requires APPLY_PRODUCTION=true, so a stray
// `npx tsx scripts/migrate/run-migrations.ts` can never write to prod.
const APPLY_MIGRATIONS = process.env.APPLY_MIGRATIONS === 'true';
const IS_PRODUCTION_TARGET = Boolean(SUPABASE_URL && SUPABASE_URL.includes('cuxzzpsyufcewtmicszk'));
const APPLY_PRODUCTION = process.env.APPLY_PRODUCTION === 'true';

if (IS_PRODUCTION_TARGET && APPLY_MIGRATIONS && !APPLY_PRODUCTION) {
  console.error('❌ Refusing to apply migrations to the production project.');
  console.error('   Set APPLY_PRODUCTION=true explicitly to proceed.');
  process.exit(1);
}

if (!APPLY_MIGRATIONS) {
  console.log('🔍 DRY RUN (default) — no migrations will be applied.');
  console.log('   To apply: APPLY_MIGRATIONS=true npx tsx scripts/migrate/run-migrations.ts');
  console.log('   Production also requires: APPLY_PRODUCTION=true');
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function runMigrations() {
  console.log('🚀 Starting database migrations...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // Migration files to run (in order)
  const migrations = [
    'supabase/migrations/paris_schema.sql',
    'supabase/migrations/paris_media_schema.sql',
  ];

  for (const migrationFile of migrations) {
    const fullPath = path.join(process.cwd(), migrationFile);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Skipping ${migrationFile} (not found)`);
      continue;
    }

    console.log(`📦 Running: ${migrationFile}`);
    
    const sql = fs.readFileSync(fullPath, 'utf-8');
    
    // Remove comments and split into statements
    const cleanSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Simple statement splitting (handles most cases)
    const statements: string[] = [];
    let current = '';
    let inFunction = false;
    
    for (const line of cleanSql.split('\n')) {
      current += line + '\n';
      
      // Track if we're inside a function definition
      if (line.includes('CREATE FUNCTION') || line.includes('CREATE OR REPLACE FUNCTION')) {
        inFunction = true;
      }
      if (inFunction && line.includes('$$ LANGUAGE')) {
        inFunction = false;
        statements.push(current.trim());
        current = '';
      }
      
      // End of statement
      if (!inFunction && line.trim().endsWith(';')) {
        const stmt = current.trim();
        if (stmt.length > 0 && !stmt.startsWith('CREATE EXTENSION')) {
          statements.push(stmt.slice(0, -1)); // Remove trailing ;
        }
        current = '';
      }
    }

    if (!APPLY_MIGRATIONS) {
      console.log(`   🔍 Dry run: ${migrationFile} would be applied (${statements.length} statements parsed, 0 executed)`);
      continue;
    }

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (!statement.trim() || statement.length < 10) {
        skippedCount++;
        continue;
      }

      try {
        const { error } = await supabase.rpc('pg_execute', {
          sql_query: statement
        });
        if (error) {
          console.error(`   ❌ Statement failed: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (e) {
        console.error(`   ❌ Statement threw: ${(e as Error).message}`);
        errorCount++;
      }
    }

    console.log(`   ✅ ${successCount} statements, ${skippedCount} skipped, ${errorCount} failed`);
    if (errorCount > 0) {
      console.error(`\n❌ ${errorCount} statement(s) failed in ${migrationFile} — stopping.`);
      process.exit(1);
    }
  }

  console.log('\n✅ All migrations completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Verify tables in Supabase Dashboard > Table Editor');
  console.log('   2. Check for any errors in migration logs');
  console.log('   3. Enable Row Level Security policies if needed');
}

// Run if called directly
runMigrations().catch(console.error);
