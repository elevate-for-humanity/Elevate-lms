import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Load role IDs
const { data: roleRows } = await db.from('roles').select('id,name');
const roleId: Record<string, string> = {};
for (const r of roleRows || []) roleId[r.name] = r.id;
console.log('Role IDs:', Object.keys(roleId).join(', '));

// Load user IDs
const emails = [
  'mesmerizedbybeautyl@yahoo.com',
  'info@centerofdestiny.org',
  'amecosenterprise@gmail.com',
  'adamkriech1@gmail.com',
  'elizabethpowell6262@gmail.com',
];
const { data: profiles } = await db.from('profiles').select('id,email,role').in('email', emails);
const byEmail: Record<string, any> = {};
for (const p of profiles || []) byEmail[p.email] = p;

// Multi-role assignments
const assignments: [string, string[]][] = [
  ['mesmerizedbybeautyl@yahoo.com',  ['staff', 'program_holder']],
  ['info@centerofdestiny.org',        ['program_holder', 'employer']],
  ['amecosenterprise@gmail.com',      ['program_holder', 'employer']],
  ['adamkriech1@gmail.com',           ['partner', 'employer']],
  ['elizabethpowell6262@gmail.com',   ['partner', 'program_holder']],
];

let ok = 0, fail = 0;
for (const [email, roles] of assignments) {
  const user = byEmail[email];
  if (!user) { console.log('  NOT FOUND:', email); continue; }
  for (const roleName of roles) {
    const rId = roleId[roleName];
    if (!rId) { console.log('  No role_id for:', roleName); continue; }
    // Check if row already exists to avoid duplicates
    const { data: existing } = await db.from('user_roles')
      .select('id').eq('user_id', user.id).eq('role_id', rId).maybeSingle();
    if (existing) { console.log(`  SKIP  ${email} + ${roleName} (already exists)`); ok++; continue; }
    const { error } = await db.from('user_roles').insert({ user_id: user.id, role_id: rId });
    if (error) { console.log(`  FAIL  ${email} + ${roleName}: ${error.message}`); fail++; }
    else { console.log(`  OK    ${email} + ${roleName}`); ok++; }
  }
}

console.log(`\nDone. OK: ${ok}  Failed: ${fail}`);

// Verify
const { data: check } = await db
  .from('user_roles')
  .select('user_id, role:roles(name), profiles(email,full_name)')
  .in('profiles.email', emails);
console.log('\nuser_roles entries for these users:');
for (const r of check || []) {
  const p = (r.profiles as any);
  if (p?.email) console.log(`  ${String((r.role as any)?.name).padEnd(16)} ${p.email}`);
}
