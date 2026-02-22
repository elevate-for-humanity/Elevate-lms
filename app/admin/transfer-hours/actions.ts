'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function approveTransferHours(
  requestId: string,
  hoursApproved: number,
  notes?: string
) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    throw new Error('Unauthorized');
  }

  const { error } = await db
    .from('transfer_hours')
    .update({
      status: 'approved',
      hours_approved: hoursApproved,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    throw new Error('Operation failed');
  }

  revalidatePath('/admin/transfer-hours');
}

export async function denyTransferHours(requestId: string, notes?: string) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    throw new Error('Unauthorized');
  }

  const { error } = await db
    .from('transfer_hours')
    .update({
      status: 'denied',
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    throw new Error('Operation failed');
  }

  revalidatePath('/admin/transfer-hours');
}
