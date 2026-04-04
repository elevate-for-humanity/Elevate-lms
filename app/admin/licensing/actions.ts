'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';

export async function updateLicenseStatus(licenseId: string, status: string) {
  const supabase = await createClient();
  const db = createAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  const { error } = await db.from('licenses').update({ status }).eq('id', licenseId);
  if (error) return { error: 'Failed to update license status' };

  await writeAdminAuditEvent(supabase, {
    action: AuditActions.LICENSE_UPDATED,
    target_type: 'license',
    target_id: licenseId,
    metadata: { status_change: status },
  });

  return { success: true };
}
