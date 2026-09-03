#!/usr/bin/env node
/**
 * Print live vs empty counts for public metrics tables.
 * Usage: node scripts/ops/live-platform-counts.mjs
 * Requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL in env (.env.local).
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
function loadEnvLocal() {
  const p = join(ROOT, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i);
    let v = t.slice(i + 1);
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key || key === 'placeholder') {
  console.error('Missing real Supabase credentials in .env.local');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function count(table, filter) {
  let q = db.from(table).select('id', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: n, error } = await q;
  if (error) return { error: error.message };
  return { count: n ?? 0 };
}

const rows = [
  ['Students (profiles role=student)', () => count('profiles', (q) => q.eq('role', 'student'))],
  ['All profiles', () => count('profiles')],
  ['program_enrollments (all)', () => count('program_enrollments')],
  ['program_enrollments (active)', () => count('program_enrollments', (q) => q.in('status', ['active', 'enrolled', 'in_progress']))],
  ['program_enrollments (completed)', () => count('program_enrollments', (q) => q.eq('status', 'completed'))],
  ['programs (published)', () => count('programs', (q) => q.eq('published', true).neq('status', 'archived'))],
  ['programs (is_active)', () => count('programs', (q) => q.eq('is_active', true).eq('published', true))],
  ['employers (profiles role=employer)', () => count('profiles', (q) => q.eq('role', 'employer'))],
  ['employer_partners', () => count('employer_partners')],
  ['program_completion_certificates', () => count('program_completion_certificates')],
  ['certificates', () => count('certificates')],
  ['employment_outcomes (employed)', () => count('employment_outcomes', (q) => q.eq('outcome_type', 'employed'))],
  ['job_postings (active)', () => count('job_postings', (q) => q.eq('status', 'active'))],
  ['jobs (active)', () => count('jobs', (q) => q.eq('status', 'active'))],
  ['team_members (active)', () => count('team_members', (q) => q.eq('is_active', true))],
];

console.log('\n=== Elevate LMS — live database counts ===\n');
console.log('Source: Supabase project', url.replace('https://', '').split('.')[0], '\n');

for (const [label, fn] of rows) {
  const r = await fn();
  if (r.error) console.log(`${label.padEnd(42)} ERROR: ${r.error}`);
  else console.log(`${label.padEnd(42)} ${r.count}`);
}

console.log('\nNote: Public /metrics and /outcomes pages use subsets of these tables.\n');
