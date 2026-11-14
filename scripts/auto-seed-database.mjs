#!/usr/bin/env node
/**
 * Automatic Database Seeding Script
 * Seeds initial data from supabase/seeds/
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load environment variables
config({ path: join(rootDir, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check credentials
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Add them to .env.local\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Get all seed files
const seedsDir = join(rootDir, 'supabase/seeds');
let seedFiles;

try {
  seedFiles = readdirSync(seedsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // Alphabetical order
} catch (err) {
  console.error('❌ Could not read seeds directory:', err.message);
  process.exit(0);
}

if (seedFiles.length === 0) {
  process.exit(0);
}

// Run seeds
let successCount = 0;
let errorCount = 0;

for (const filename of seedFiles) {
  try {
    const sql = readFileSync(join(seedsDir, filename), 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      // Use Management API if available (works in CI without direct TCP)
      const mgmtKey = process.env.SUPABASE_MANAGEMENT_API_KEY;
      const projectRef = process.env.SUPABASE_PROJECT_REF;

      if (mgmtKey && projectRef) {
        const res = await fetch(
          `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${mgmtKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: statement }),
            signal: AbortSignal.timeout(30000),
          },
        );
        const body = await res.json().catch(() => ({}));
        if (body?.message) {
          // Treat idempotent errors as success
          const msg = body.message;
          const isIdempotent =
            msg.includes('already exists') ||
            msg.includes('duplicate key') ||
            (msg.includes('does not exist') && msg.includes('DROP'));
          if (!isIdempotent) throw new Error(msg);
        }
      } else {
        // Fallback: Supabase JS client exec_sql RPC
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          // Retry via REST if RPC not found
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ sql_query: statement }),
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
        }
      }
    }

    successCount++;
  } catch (err) {
    console.error(`❌ Error in ${filename}:`, err.message);
    errorCount++;

    // Continue with other seeds even if one fails
  }
}

// Summary

if (errorCount > 0) {
} else {
}
