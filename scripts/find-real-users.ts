#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const db = createClient(url, key, { auth: { persistSession: false } });

// Find the specific real users we need to keep
const SEARCH_NAMES = ['austin', 'pedro', 'adam', 'elizabeth', 'jordan', 'mercedes', 'natalia', 'elevate'];

const { data: profiles } = await db
  .from('profiles')
  .select('id, email, full_name, role')
  .order('full_name');

console.log('\n=== ALL PROFILES (name + role + email) ===\n');
for (const p of profiles || []) {
  const name = (p.full_name || '').toLowerCase();
  const email = (p.email || '').toLowerCase();
  const match = SEARCH_NAMES.some(s => name.includes(s) || email.includes(s));
  const flag = match ? ' <<<' : '';
  console.log(`  [${p.role}] ${p.full_name || '(no name)'}  <${p.email}>  id=${p.id}${flag}`);
}

// Also show program_enrollments to see who is actually enrolled
console.log('\n=== ACTIVE ENROLLMENTS ===\n');
const { data: enrollments } = await db
  .from('program_enrollments')
  .select('user_id, program_id, status, enrolled_at')
  .in('status', ['active', 'enrolled', 'approved']);

for (const e of enrollments || []) {
  const p = (profiles || []).find((x: any) => x.id === e.user_id);
  console.log(`  ${p?.full_name || e.user_id}  <${p?.email || '?'}>  program=${e.program_id}  status=${e.status}`);
}
