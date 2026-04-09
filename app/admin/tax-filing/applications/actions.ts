'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

export async function createTaxApplication(formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
  if (!supabase) throw new Error('Database unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: _p } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!_p || !['admin', 'super_admin'].includes(_p.role)) throw new Error('Forbidden');

  const { error } = await db.from('tax_applications').insert({
    client_name: formData.get('client_name') as string,
    client_email: formData.get('client_email') as string,
    client_phone: formData.get('client_phone') as string || null,
    filing_type: formData.get('filing_type') as string || 'individual',
    tax_year: formData.get('tax_year') as string || new Date().getFullYear().toString(),
    status: 'pending',
    notes: formData.get('notes') as string || null,
    created_by: user.id,
  });

  if (error) throw new Error('Failed to process tax filing application.');

  await logAdminAudit({ action: AdminAction.TAX_APPLICATION_CREATED, actorId: user.id, entityType: 'tax_applications', entityId: BULK_ENTITY_ID, metadata: {} });

  revalidatePath('/admin/tax-filing/applications');
  redirect('/admin/tax-filing/applications');
}
