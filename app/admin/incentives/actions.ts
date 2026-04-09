'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

export async function createIncentive(formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
  if (!supabase) throw new Error('Database unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: _profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!_profile || !['admin', 'super_admin'].includes(_profile.role)) throw new Error('Forbidden');

  const name = formData.get('name') as string;
  const type = formData.get('type') as string;
  const amount = formData.get('amount') as string;
  const employer = formData.get('employer') as string;
  const description = formData.get('description') as string;
  const start_date = formData.get('start_date') as string;
  const end_date = formData.get('end_date') as string;

  const { error } = await db.from('incentives').insert({
    name,
    type: type || 'tax_credit',
    amount: amount ? parseFloat(amount) : null,
    employer_name: employer || null,
    description: description || null,
    start_date: start_date || null,
    end_date: end_date || null,
    status: 'active',
    created_by: user.id,
  });

  if (error) throw new Error('Failed to process incentive action.');

  await logAdminAudit({ action: AdminAction.INCENTIVE_CREATED, actorId: user.id, entityType: 'incentives', entityId: BULK_ENTITY_ID, metadata: { name } });

  revalidatePath('/admin/incentives');
  redirect('/admin/incentives');
}
