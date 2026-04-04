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

  const { data: profile, error: profileError } = await db
    .from('profiles').select('role').eq('id', user.id).single();
  if (profileError) throw new Error('Profile fetch failed');
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) throw new Error('Forbidden');

  // Confirm the record exists before mutating.
  // Without this, a blind update on a non-existent ID returns success with 0 rows affected.
  const { data: record, error: fetchError } = await db
    .from('apprentice_payroll')
    .select('id, status')
    .eq('id', payrollId)
    .single();

  if (fetchError || !record) throw new Error('Payroll record not found');
  if (record.status === 'paid') return { error: 'Already marked as paid' };

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
