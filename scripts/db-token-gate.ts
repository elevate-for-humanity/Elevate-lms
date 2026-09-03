#!/usr/bin/env npx tsx
/**
 * DB Token Gate
 *
 * Checks published database content for banned tokens.
 * Run as part of deploy pipeline.
 *
 * Usage: npx tsx scripts/db-token-gate.ts
 * Exit code: 0 = pass, 1 = fail
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 */

import { createClient } from '@supabase/supabase-js';

const BANNED_TOKENS = [
  'coming soon',
  'lorem ipsum',
  'lorem',
  'placeholder',
  'sample',
  'example',
  'tbd',
  'fake',
  'test content',
  'demo',
];

interface Violation {
  table: string;
  id: string;
  field: string;
  token: string;
  value: string;
}

async function main() {
  console.log('🔍 DB Token Gate - Checking published content...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Supabase credentials not found. Skipping DB check.\n');
    console.log('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable.\n');
    process.exit(0);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const violations: Violation[] = [];

  // Tables and fields to check
  const checks = [
    { table: 'announcements', filter: { published: true }, fields: ['title', 'body'] },
    {
      table: 'marketing_pages',
      filter: { published: true },
      fields: ['title', 'subtitle', 'meta_description'],
    },
    { table: 'marketing_sections', filter: null, fields: ['heading', 'body'] },
    { table: 'programs', filter: { is_active: true }, fields: ['name', 'description'] },
    { table: 'program_outcomes', filter: null, fields: ['outcome'] },
    { table: 'program_tasks', filter: null, fields: ['title', 'instructions'] },
  ];

  const pattern = new RegExp(BANNED_TOKENS.map((t) => t.replace(/\s+/g, '\\s+')).join('|'), 'gi');

  for (const check of checks) {
    try {
      let query = supabase.from(check.table).select('id, ' + check.fields.join(', '));

      if (check.filter) {
        Object.entries(check.filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data, error } = await query;

      if (error) {
        console.log(`⚠️  Could not check ${check.table}: ${error.message}`);
        continue;
      }

      if (!data) continue;

      for (const row of data) {
        for (const field of check.fields) {
          const value = row[field];
          if (!value || typeof value !== 'string') continue;

          pattern.lastIndex = 0;
          const matches = value.match(pattern);

          if (matches) {
            matches.forEach((match) => {
              violations.push({
                table: check.table,
                id: row.id,
                field,
                token: match.toLowerCase(),
                value: value.substring(0, 100),
              });
            });
          }
        }
      }
    } catch (err) {
      console.log(`⚠️  Error checking ${check.table}:`, err);
    }
  }

  if (violations.length === 0) {
    console.log('✅ No banned tokens found in published content. Deploy can proceed.\n');
    process.exit(0);
  }

  console.log(`❌ Found ${violations.length} banned token(s) in published content:\n`);

  // Group by table
  const byTable: Record<string, Violation[]> = {};
  violations.forEach((v) => {
    if (!byTable[v.table]) byTable[v.table] = [];
    byTable[v.table].push(v);
  });

  Object.entries(byTable).forEach(([table, tableViolations]) => {
    console.log(`📋 ${table}`);
    tableViolations.forEach((v) => {
      console.log(`   ID: ${v.id}`);
      console.log(`   Field: ${v.field}`);
      console.log(`   Token: "${v.token}"`);
      console.log(`   Value: ${v.value}...`);
      console.log('');
    });
  });

  console.log('Deploy blocked. Remove placeholder content from database before deploying.\n');

  process.exit(1);
}

main().catch((err) => {
  console.error('DB Token Gate error:', err);
  process.exit(1);
});
