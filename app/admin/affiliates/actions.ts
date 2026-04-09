'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

export async function createAffiliate(formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');
  if (!supabase) throw new Error('Database unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: _profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!_profile || !['admin', 'super_admin'].includes(_profile.role)) throw new Error('Forbidden');

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const website = formData.get('website') as string;
  const commission = formData.get('commission') as string;
  const notes = formData.get('notes') as string;

  const { error } = await db.from('affiliates').insert({
    name,
    email,
    phone: phone || null,
    website: website || null,
    commission_rate: commission ? parseFloat(commission) : null,
    notes: notes || null,
    status: 'pending',
    created_by: user.id,
  });

  if (error) {
    // If table doesn't exist, insert into a general contacts/partners table
    const { error: fallbackError } = await db.from('profiles').insert({
      full_name: name,
      email,
      phone: phone || null,
      role: 'affiliate',
    });
    if (fallbackError) throw new Error(fallbackError.message);
  }

  await logAdminAudit({ action: AdminAction.AFFILIATE_CREATED, actorId: user.id, entityType: 'affiliates', entityId: BULK_ENTITY_ID, metadata: { name, email } });

  revalidatePath('/admin/affiliates');
  redirect('/admin/affiliates');
}
