#!/usr/bin/env node
/**
 * Regenerate types/database.generated.ts from the live Supabase schema.
 *
 * Usage:
 *   node scripts/gen-db-types.js
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment or .env.local.
 * Falls back to hardcoded project URL if env vars are absent (dev only).
 */

const fs = require('fs');
const path = require('path');

// Load .env.local if present
try {
  const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  for (const line of envFile.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://cuxzzpsyufcewtmicszk.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set. Cannot generate types.');
  process.exit(1);
}

function pgTypeToTs(format, type) {
  const f = (format || '').toLowerCase();
  const t = (type || '').toLowerCase();
  if (f === 'uuid') return 'string';
  if (['timestamp with time zone', 'timestamptz', 'date', 'time without time zone'].includes(f)) return 'string';
  if (['json', 'jsonb'].includes(f)) return 'Json';
  if (f === 'boolean' || t === 'boolean') return 'boolean';
  if (['integer', 'int4', 'int8', 'bigint', 'numeric', 'float4', 'float8'].includes(f) ||
      ['integer', 'number'].includes(t)) return 'number';
  if (t === 'array') return 'string[]';
  return 'string';
}

async function main() {
  console.log(`Fetching schema from ${SUPABASE_URL}...`);
  const r = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
  });
  if (!r.ok) {
    console.error(`Schema fetch failed: HTTP ${r.status}`);
    process.exit(1);
  }
  const schema = await r.json();
  const defs = schema.definitions || {};
  const tables = Object.keys(defs).sort();
  console.log(`  ${tables.length} tables found`);

  let out = `// =============================================================================
// DATABASE TYPES — auto-generated from live Supabase schema
// Generated: ${new Date().toISOString()}
// Project: ${SUPABASE_URL.match(/\/\/([^.]+)/)?.[1] || 'unknown'}
// DO NOT EDIT MANUALLY — regenerate with: node scripts/gen-db-types.js
// =============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
`;

  for (const table of tables) {
    const def = defs[table];
    const props = def.properties || {};
    const required = new Set(def.required || []);
    const cols = Object.entries(props);

    const rowFields = cols.map(([col, prop]) => {
      const tsType = pgTypeToTs(prop.format, prop.type);
      const nullable = !required.has(col);
      return `          ${col}: ${tsType}${nullable ? ' | null' : ''}`;
    }).join('\n');

    const insertFields = cols.map(([col, prop]) => {
      const tsType = pgTypeToTs(prop.format, prop.type);
      const nullable = !required.has(col);
      return `          ${col}?: ${tsType}${nullable ? ' | null' : ''} | undefined`;
    }).join('\n');

    out += `      ${table}: {
        Row: {
${rowFields || '          [key: string]: unknown'}
        }
        Insert: {
${insertFields || '          [key: string]: unknown'}
        }
        Update: {
${insertFields || '          [key: string]: unknown'}
        }
      }\n`;
  }

  out += `    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience row type aliases
// ---------------------------------------------------------------------------
`;

  const aliases = [
    'academic_integrity_violations', 'accessibility_preferences',
    'audit_logs', 'checkpoint_scores', 'consent_records',
    'course_lessons', 'course_modules', 'courses',
    'curriculum_lessons', 'data_deletion_requests',
    'documents', 'enrollment_funding_records',
    'exam_funding_authorizations', 'form_fields', 'form_submissions', 'forms',
    'lesson_progress', 'messages', 'modules',
    'pages', 'page_sections', 'placement_records',
    'profiles', 'program_certification_pathways',
    'program_ctas', 'program_enrollments', 'program_media', 'program_modules',
    'programs', 'provider_applications', 'provider_compliance_artifacts',
    'provider_onboarding_steps', 'provider_program_approvals',
    'step_submissions', 'tax_clients', 'tax_returns',
    'tenant_compliance_records', 'training_lessons',
    'webinar_registrations', 'webinars',
    'wioa_participant_records', 'wioa_participants',
  ];

  for (const t of aliases) {
    if (defs[t]) {
      const typeName = t.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('');
      out += `export type ${typeName}Row = Database['public']['Tables']['${t}']['Row']\n`;
      out += `export type ${typeName}Insert = Database['public']['Tables']['${t}']['Insert']\n`;
    }
  }

  const outPath = path.join(__dirname, '../types/database.generated.ts');
  fs.writeFileSync(outPath, out);
  console.log(`Written: types/database.generated.ts (${out.split('\n').length} lines)`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
