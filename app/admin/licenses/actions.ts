'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

export async function createLicense(formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
  if (!supabase) throw new Error('Database unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: _profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!_profile || !['admin', 'super_admin'].includes(_profile.role)) throw new Error('Forbidden');

  const { error } = await db.from('licenses').insert({
    tenant_id: formData.get('tenant_id') as string || null,
    tier: formData.get('tier') as string || 'standard',
    status: 'active',
    expires_at: formData.get('expires_at') as string || null,
  });

  if (error) throw new Error('Failed to process license action.');

  await logAdminAudit({ action: AdminAction.LICENSE_CREATED, actorId: user.id, entityType: 'licenses', entityId: BULK_ENTITY_ID, metadata: { tier: formData.get('tier') as string } });

  revalidatePath('/admin/licenses');
  redirect('/admin/licenses');
}
