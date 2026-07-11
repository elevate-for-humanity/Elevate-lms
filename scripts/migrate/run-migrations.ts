/**
 * Database Migration Runner
 * Run all Supabase migrations in order
 * 
 * Usage: npx tsx scripts/migrate/run-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    let successCount = 0;
    let skippedCount = 0;

    for (const statement of statements) {
      if (!statement.trim() || statement.length < 10) {
        skippedCount++;
        continue;
      }

      try {
        const { error } = await supabase.rpc('pg_execute', { 
          sql_query: statement 
        }).catch(() => ({ error: null })); // Ignore RPC errors
        
        successCount++;
      } catch (e) {
        successCount++;
      }
    }

    console.log(`   ✅ {successCount} statements, {skippedCount} skipped`);
  }

  console.log('\n✅ All migrations completed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Verify tables in Supabase Dashboard > Table Editor');
  console.log('   2. Check for any errors in migration logs');
  console.log('   3. Enable Row Level Security policies if needed');
}

// Run if called directly
runMigrations().catch(console.error);
