import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Elizabeth Greene elizabethpowell6262 → partner
// Elizabeth L. Greene elizabthpowell6262  → admin (already correct, keep)
// Adam Kriech adamkriech1               → partner (confirm/set)

const targets = [
  { email: 'elizabethpowell6262@gmail.com', newRole: 'partner' },
  { email: 'adamkriech1@gmail.com',         newRole: 'partner' },
];

const { data: before } = await db
  .from('profiles')
  .select('id,email,full_name,role')
  .in('email', [
    'elizabethpowell6262@gmail.com',
    'elizabthpowell6262@gmail.com',
    'adamkriech1@gmail.com',
  ]);

console.log('Before:');
for (const p of before || []) {
  console.log(`  ${p.role.padEnd(16)} ${p.email}  (${p.full_name})`);
}

for (const t of targets) {
  const { error } = await db.from('profiles').update({ role: t.newRole }).eq('email', t.email);
  if (error) {
    console.error(`  FAIL update ${t.email}: ${error.message}`);
  } else {
    console.log(`\n  ✓ Set ${t.email} → ${t.newRole}`);
  }
}

const { data: after } = await db
  .from('profiles')
  .select('id,email,full_name,role')
  .in('email', [
    'elizabethpowell6262@gmail.com',
    'elizabthpowell6262@gmail.com',
    'adamkriech1@gmail.com',
  ]);

console.log('\nAfter:');
for (const p of (after || [])) {
  console.log(`  ${p.role.padEnd(16)} ${p.email}  (${p.full_name})`);
}
