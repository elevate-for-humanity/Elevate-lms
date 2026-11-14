#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) { console.error('missing env vars'); process.exit(1); }

const db = createClient(url, key, { auth: { persistSession: false } });

async function getAllAuthUsers() {
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

const users = await getAllAuthUsers();
const { data: profiles } = await db.from('profiles').select('id, email, full_name, role, created_at');
const profileMap: Record<string, any> = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));

const TEST_PATTERNS = [
  /test/i, /demo/i, /sample/i, /fake/i, /dummy/i, /example\.com$/,
  /placeholder/i, /^admin@/, /noreply/i, /deleteme/i, /junk/i,
  /^user\d+@/, /^student\d+@/, /^instructor\d+@/,
];
function isTest(email: string | null) {
  return TEST_PATTERNS.some(p => p.test(email || ''));
}

// Build email→accounts map
const emailMap: Record<string, any[]> = {};
for (const u of users) {
  const e = (u.email || '').toLowerCase().trim();
  if (!e) continue;
  if (!emailMap[e]) emailMap[e] = [];
  emailMap[e].push(u);
}

interface Row {
  id: string;
  email: string;
  full_name: string;
  role: string;
  confirmed: boolean;
  last_sign_in: string;
  created: string;
  is_test: boolean;
  is_dup: boolean;
}

const rows: Row[] = [];
for (const u of users) {
  const e = (u.email || '').toLowerCase().trim();
  const p = profileMap[u.id] || {};
  rows.push({
    id: u.id,
    email: u.email || '(no email)',
    full_name: p.full_name || u.user_metadata?.full_name || '',
    role: p.role || '(no profile)',
    confirmed: !!u.email_confirmed_at,
    last_sign_in: u.last_sign_in_at ? u.last_sign_in_at.slice(0, 10) : 'never',
    created: (u.created_at || '').slice(0, 10),
    is_test: isTest(u.email),
    is_dup: (emailMap[e] || []).length > 1,
  });
}

rows.sort((a, b) => {
  if (a.is_dup !== b.is_dup) return a.is_dup ? -1 : 1;
  if (a.is_test !== b.is_test) return a.is_test ? -1 : 1;
  return a.email.localeCompare(b.email);
});

const tests = rows.filter(r => r.is_test);
const dups = rows.filter(r => r.is_dup);
const noProfile = rows.filter(r => r.role === '(no profile)');
const neverLoggedIn = rows.filter(r => r.last_sign_in === 'never');
const clean = rows.filter(r => !r.is_test && !r.is_dup);

console.log('\n========= USER AUDIT SUMMARY =========');
console.log(`Total auth users : ${rows.length}`);
console.log(`Clean real users : ${clean.length}`);
console.log(`Test accounts    : ${tests.length}`);
console.log(`Duplicate emails : ${dups.length}`);
console.log(`No profile row   : ${noProfile.length}`);
console.log(`Never logged in  : ${neverLoggedIn.length}`);
console.log('');

if (dups.length > 0) {
  console.log('--- DUPLICATES ---');
  const seen = new Set<string>();
  for (const r of dups) {
    const e = r.email.toLowerCase();
    if (seen.has(e)) continue;
    seen.add(e);
    const group = emailMap[e] || [];
    console.log(`  ${e} — ${group.length} accounts`);
    for (const u of group) {
      const p = profileMap[u.id] || {};
      console.log(`    id=${u.id}  created=${(u.created_at || '').slice(0, 10)}  last_signin=${u.last_sign_in_at ? u.last_sign_in_at.slice(0, 10) : 'never'}  confirmed=${!!u.email_confirmed_at}  role=${p.role || 'no-profile'}`);
    }
  }
  console.log('');
}

if (tests.length > 0) {
  console.log('--- TEST / FLAGGED ACCOUNTS ---');
  for (const r of tests) {
    console.log(`  [${r.role}] ${r.email}  created=${r.created}  last_signin=${r.last_sign_in}  id=${r.id}`);
  }
  console.log('');
}

console.log('--- ALL USERS (sorted) ---');
for (const r of rows) {
  const flags = [
    r.is_test ? 'TEST' : '',
    r.is_dup ? 'DUP' : '',
    r.role === '(no profile)' ? 'NO-PROFILE' : '',
  ].filter(Boolean).join(',');
  console.log(`  [${r.role}]  ${r.email}  | name="${r.full_name}"  last_signin=${r.last_sign_in}  confirmed=${r.confirmed}  ${flags ? '[' + flags + ']' : ''}`);
}
