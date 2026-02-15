'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveTransferHours(
  requestId: string,
  hoursApproved: number,
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
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
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
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
