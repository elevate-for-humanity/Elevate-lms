import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function tableExists(name: string): Promise<boolean> {
  const { error } = await db.from(name as any).select('*').limit(0);
  return !error || !error.message?.includes('does not exist');
}

async function policyExists(table: string, policy: string): Promise<boolean> {
  const { data } = await db
    .from('pg_policies' as any)
    .select('policyname')
    .eq('tablename', table)
    .eq('policyname', policy)
    .maybeSingle();
  return !!data;
}

const checks = [
  { label: 'curriculum_uploads table (migration 000006)', check: () => tableExists('curriculum_uploads') },
  { label: 'program_holders.user_id constraint dropped (migration 000009)', check: async () => {
    // Constraint was dropped — verify by checking it no longer exists
    const { data } = await db
      .from('information_schema.table_constraints' as any)
      .select('constraint_name')
      .eq('table_name', 'program_holders')
      .eq('constraint_name', 'unique_program_holders_user_id')
      .maybeSingle();
    return !data; // good if constraint is gone
  }},
  { label: 'profiles_own_read RLS policy', check: () => policyExists('profiles', 'profiles_own_read') },
  { label: 'platform_secrets table', check: () => tableExists('platform_secrets') },
  { label: 'admin profile for curvaturebodysculpting@gmail.com', check: async () => {
    const { data } = await db.from('profiles').select('role').eq('email', 'curvaturebodysculpting@gmail.com').maybeSingle();
    return data?.role === 'admin';
  }},
];

for (const c of checks) {
  const ok = await c.check();
  console.log(`${ok ? '✅' : '❌'} ${c.label}`);
}
