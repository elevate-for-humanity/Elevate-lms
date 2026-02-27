'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';

export async function markPayrollPaid(payrollId: string) {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

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
