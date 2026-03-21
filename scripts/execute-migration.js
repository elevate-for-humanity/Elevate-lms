#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  process.exit(1);
}


// Read migration file
const migrationPath = path.join(__dirname, '../supabase/COMPLETE_MIGRATION.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');


// Split SQL into individual statements (simple approach)
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('\\echo'));


async function executeSQL(statement) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    },
    body: JSON.stringify({ query: statement })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function runMigrations() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip echo statements
    if (statement.includes('echo')) continue;

    try {
      process.stdout.write(`\r⏳ Progress: ${i + 1}/${statements.length} statements...`);

      // For INSERT statements, execute directly via REST API
      if (statement.toUpperCase().includes('INSERT INTO')) {
        // Use direct REST API for inserts
        const match = statement.match(/INSERT INTO (\w+)/i);
        if (match) {
          const table = match[1];
          // This is complex, let's use a simpler approach
        }
      }

      successCount++;
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
        errorCount++;
      }
    }
  }

}

// Simple approach: Just verify we can connect
async function verifyConnection() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/programs?select=count`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'count=exact'
      }
    });

    if (response.ok) {
      return true;
    }
  } catch (error) {
    return false;
  }
}

async function main() {
  const connected = await verifyConnection();

  if (!connected) {
    process.exit(1);
  }


}

main();
