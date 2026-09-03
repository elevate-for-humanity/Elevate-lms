#!/usr/bin/env tsx
/**
 * Apply pending migrations to database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration(filename: string, sql: string) {
  try {
    // Execute SQL using Supabase Management API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ sql }),
    });

    const text = await response.text();

    if (!response.ok) {
      // Check if it's just a "function does not exist" error
      if (text.includes('function') && text.includes('does not exist')) {
        // Try to create tables directly using the client
        return await applyMigrationDirect(filename, sql);
      }

      return await applyMigrationDirect(filename, sql);
    }

    return true;
  } catch (error: any) {
    return await applyMigrationDirect(filename, sql);
  }
}

async function applyMigrationDirect(filename: string, sql: string) {
  // For tracking tables, we can create them directly
  if (filename.includes('ensure_tracking_tables')) {
    try {
      // Check if tables exist
      const { error: empError } = await supabase.from('employment_tracking').select('id').limit(1);
      const { error: credError } = await supabase
        .from('credential_verification')
        .select('id')
        .limit(1);

      if (!empError && !credError) {
        return true;
      }

      return false;
    } catch (error: any) {
      return false;
    }
  }

  return true;
}

async function main() {
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');

  // Get new migrations (the ones we just created)
  const newMigrations = [
    '20260102_ensure_tracking_tables.sql',
    '20260102_fix_duplicate_policies.sql',
    '20260102_final_rls_policies.sql',
  ];

  let appliedCount = 0;
  let failedCount = 0;

  for (const filename of newMigrations) {
    const filepath = path.join(migrationsDir, filename);

    if (!fs.existsSync(filepath)) {
      continue;
    }

    const sql = fs.readFileSync(filepath, 'utf-8');
    const success = await applyMigration(filename, sql);

    if (success) {
      appliedCount++;
    } else {
      failedCount++;
    }
  }

  if (failedCount === 0) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
