'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';

export async function markPayrollPaid(payrollId: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth failed: ${authError.message}`);
  if (!user) throw new Error('Not authenticated');

  const db = createAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  const { data: profile, error: profileError } = await db
    .from('profiles').select('role').eq('id', user.id).single();
  if (profileError) throw new Error(`Profile fetch failed: ${profileError.message}`);
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) throw new Error('Forbidden');

  const { error } = await db
    .from('apprentice_payroll')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', payrollId);

  if (error) return { error: 'Failed to mark payroll as paid' };

  await writeAdminAuditEvent(supabase, {
    action: AuditActions.PAYROLL_RECORD_UPDATED,
    target_type: 'apprentice_payroll',
    target_id: payrollId,
    metadata: { status_change: 'paid' },
  });

  return { success: true };
}
