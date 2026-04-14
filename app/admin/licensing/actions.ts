'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';

export async function updateLicenseStatus(licenseId: string, status: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error('Auth failed');
  if (!user) throw new Error('Not authenticated');

  const db = await getAdminClient();

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) throw new Error('Forbidden');

  // Confirm the license exists before mutating.
  const { data: record, error: fetchError } = await db
    .from('licenses')
    .select('id, status')
    .eq('id', licenseId)
    .single();

  if (fetchError || !record) throw new Error('License not found');

  const { error } = await db.from('licenses').update({ status }).eq('id', licenseId);
  if (error) return { error: 'Failed to update license status' };

  await writeAdminAuditEvent(supabase, {
    action: AuditActions.LICENSE_UPDATED,
    target_type: 'license',
    target_id: licenseId,
    metadata: { status_change: status, previous_status: record.status },
  });

  return { success: true };
}
