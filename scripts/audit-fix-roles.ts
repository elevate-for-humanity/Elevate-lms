#!/usr/bin/env tsx
/**
 * Role audit and fix script.
 *
 * Checks:
 *  1. Auth user with no profile row → creates a profile with role='student'
 *  2. Profile with NULL/empty/invalid role → sets to 'student'
 *  3. Email mismatch between auth.users and profiles.email → corrects profile email
 *  4. Duplicate profile rows for the same auth id (shouldn't happen but reports if found)
 *
 * Valid roles (from AGENTS.md + codebase):
 *   student | instructor | admin | admin | staff |
 *   program_holder | provider_admin | case_manager | employer | partner | delegate
 *
 * Run: pnpm tsx scripts/audit-fix-roles.ts [--fix]
 * Dry-run by default. Pass --fix to apply changes.
 */
import { createClient } from '@supabase/supabase-js';

const VALID_ROLES = new Set([
  'student', 'instructor', 'admin', 'staff',
  'program_holder', 'provider_admin', 'case_manager', 'employer', 'partner', 'delegate',
]);

// Do NOT create profiles for test/fake accounts — they should be deleted, not fixed
const TEST_PATTERNS = [
  /test/i, /demo/i, /fake/i, /dummy/i, /example\.com$/i,
  /placeholder/i, /noreply/i, /deleteme/i, /elevate\.test$/i,
  /elevate-test/i, /elevatetest\.com$/i, /elevate-demo\.test$/i,
  /test-elevate/i, /\.test\./i, /student\.elevate\.edu$/i,
  /resend\.dev$/i, /acme-hvac\.test$/i, /\.internal$/i,
];
const isTestEmail = (email: string) => TEST_PATTERNS.some(p => p.test(email));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false } });
const DRY_RUN = !process.argv.includes('--fix');
console.log(DRY_RUN ? '\n[DRY RUN — pass --fix to apply changes]\n' : '\n[LIVE FIX MODE]\n');

// ── 1. Fetch all auth users ──────────────────────────────────────────────────
async function getAllAuthUsers(): Promise<any[]> {
  const all: any[] = [];
  let page = 1;
  while (true) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    all.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }
  return all;
}

const authUsers = await getAllAuthUsers();
console.log(`Auth users total: ${authUsers.length}`);

// ── 2. Fetch all profiles ────────────────────────────────────────────────────
const { data: profiles, error: pErr } = await db
  .from('profiles')
  .select('id, email, full_name, role');
if (pErr) { console.error('profiles fetch error:', pErr.message); process.exit(1); }

// Map: auth_id → profile row
const profileById: Record<string, any> = {};
// Track duplicate profiles per id (shouldn't exist but check)
const profileCountById: Record<string, number> = {};
for (const p of profiles || []) {
  profileCountById[p.id] = (profileCountById[p.id] || 0) + 1;
  profileById[p.id] = p;
}

// ── 3. Analyse ────────────────────────────────────────────────────────────────
const issues: Array<{ type: string; id: string; email: string; detail: string; fix: string }> = [];

for (const u of authUsers) {
  const id = u.id;
  const authEmail = (u.email || '').toLowerCase().trim();
  const p = profileById[id];

  // Duplicate profiles check
  if ((profileCountById[id] || 0) > 1) {
    issues.push({ type: 'DUPLICATE_PROFILE', id, email: authEmail, detail: `${profileCountById[id]} profile rows found`, fix: 'manual — check DB' });
  }

  // Missing profile
  if (!p) {
    // Skip test/fake accounts — they should be deleted, not given profiles
    if (isTestEmail(authEmail)) continue;
    const name = u.user_metadata?.full_name || u.user_metadata?.name || '';
    issues.push({ type: 'NO_PROFILE', id, email: authEmail, detail: 'no profile row', fix: `INSERT role=student email=${authEmail}` });
    if (!DRY_RUN) {
      const { error } = await db.from('profiles').insert({
        id,
        email: authEmail,
        full_name: name,
        role: 'student',
      });
      if (error) console.error(`  [ERR] insert profile ${id}: ${error.message}`);
      else console.log(`  [FIX] created profile for ${authEmail}`);
    }
    continue;
  }

  // Invalid or missing role
  const role = (p.role || '').trim().toLowerCase();
  if (!role || !VALID_ROLES.has(role)) {
    issues.push({ type: 'BAD_ROLE', id, email: authEmail, detail: `role='${role || 'NULL'}'`, fix: `SET role=student` });
    if (!DRY_RUN) {
      const { error } = await db.from('profiles').update({ role: 'student' }).eq('id', id);
      if (error) console.error(`  [ERR] fix role ${id}: ${error.message}`);
      else console.log(`  [FIX] set role=student for ${authEmail}`);
    }
  }

  // Email mismatch
  const profileEmail = (p.email || '').toLowerCase().trim();
  if (authEmail && profileEmail && profileEmail !== authEmail) {
    issues.push({ type: 'EMAIL_MISMATCH', id, email: authEmail, detail: `profile.email='${p.email}' vs auth.email='${authEmail}'`, fix: `SET email=${authEmail}` });
    if (!DRY_RUN) {
      const { error } = await db.from('profiles').update({ email: authEmail }).eq('id', id);
      if (error) console.error(`  [ERR] fix email ${id}: ${error.message}`);
      else console.log(`  [FIX] synced email for ${authEmail}`);
    }
  }

  // Profile email blank but auth has one
  if (authEmail && !profileEmail) {
    issues.push({ type: 'MISSING_PROFILE_EMAIL', id, email: authEmail, detail: `profile.email is blank`, fix: `SET email=${authEmail}` });
    if (!DRY_RUN) {
      const { error } = await db.from('profiles').update({ email: authEmail }).eq('id', id);
      if (error) console.error(`  [ERR] set email ${id}: ${error.message}`);
      else console.log(`  [FIX] backfilled email for ${authEmail}`);
    }
  }
}

// ── 4. Report ─────────────────────────────────────────────────────────────────
const counts: Record<string, number> = {};
for (const i of issues) counts[i.type] = (counts[i.type] || 0) + 1;

console.log('\n======= ROLE / AUTH AUDIT RESULTS =======');
console.log(`  NO_PROFILE           : ${counts['NO_PROFILE'] || 0}`);
console.log(`  BAD_ROLE             : ${counts['BAD_ROLE'] || 0}`);
console.log(`  EMAIL_MISMATCH       : ${counts['EMAIL_MISMATCH'] || 0}`);
console.log(`  MISSING_PROFILE_EMAIL: ${counts['MISSING_PROFILE_EMAIL'] || 0}`);
console.log(`  DUPLICATE_PROFILE    : ${counts['DUPLICATE_PROFILE'] || 0}`);
console.log(`  TOTAL ISSUES         : ${issues.length}`);

if (issues.length > 0) {
  console.log('\nISSUE DETAILS:');
  for (const i of issues) {
    console.log(`  [${i.type}] ${i.email}  (${i.id})  → ${i.detail}  FIX: ${i.fix}`);
  }
}

// ── 5. Role distribution report ───────────────────────────────────────────────
const roleDist: Record<string, number> = {};
for (const p of profiles || []) {
  const r = (p.role || 'NULL').trim();
  roleDist[r] = (roleDist[r] || 0) + 1;
}
// Add auth users with no profile
const noProfileCount = authUsers.filter(u => !profileById[u.id]).length;
if (noProfileCount > 0) roleDist['(no profile)'] = noProfileCount;

console.log('\nROLE DISTRIBUTION:');
const sorted = Object.entries(roleDist).sort((a, b) => b[1] - a[1]);
for (const [role, count] of sorted) {
  const valid = VALID_ROLES.has(role);
  const flag = !valid && role !== '(no profile)' && role !== 'NULL' ? ' ⚠ INVALID' : '';
  console.log(`  ${String(count).padStart(4)} × ${role}${flag}`);
}

if (DRY_RUN && issues.length > 0) {
  console.log('\nRun with --fix to apply all corrections automatically.');
}

console.log('\nDone.');
