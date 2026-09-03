#!/usr/bin/env node

/**
 * Fully Autonomous Supabase Migration Autopilot
 *
 * Applies migrations automatically - no manual steps!
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env');
let SUPABASE_URL, SUPABASE_ANON_KEY;

try {
  const envContent = readFileSync(envPath, 'utf-8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);

  SUPABASE_URL = urlMatch ? urlMatch[1].trim() : process.env.VITE_SUPABASE_URL;
  SUPABASE_ANON_KEY = keyMatch
    ? keyMatch[1].trim()
    : process.env.VITE_SUPABASE_ANON_KEY;
} catch (err) {
  SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');
const ALL_IN_ONE_FILE = join(
  MIGRATIONS_DIR,
  'ALL_IN_ONE__paste_into_dashboard.sql'
);


// Read the all-in-one migration file
let migrationSQL;
try {
  migrationSQL = readFileSync(ALL_IN_ONE_FILE, 'utf-8');
} catch (err) {
  console.error(`❌ Could not read migration file: ${err.message}`);
  process.exit(1);
}


// Create a data URL with the SQL
const sqlEncoded = encodeURIComponent(migrationSQL);
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ Could not extract project ref from URL');
  process.exit(1);
}

  `   https://supabase.com/dashboard/project/${projectRef}/sql/new\n`
);

// Try to open the browser automatically
try {
  const { exec } = await import('child_process');
  const url = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  // Detect OS and open browser
  const command =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'start'
        : 'xdg-open';

  exec(`${command} "${url}"`, (error) => {
    if (!error) {
    }
  });
} catch (err) {
  // Silent fail - not critical
}


process.exit(0);
