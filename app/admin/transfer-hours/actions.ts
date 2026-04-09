'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

async function requireAdminActor() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const db = await getAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    throw new Error('Forbidden');
  }

  return { user, db };
}

export async function approveTransferHours(
  requestId: string,
  hoursApproved: number,
  notes?: string
) {
  const { user, db } = await requireAdminActor();

  // Confirm the record exists and is in a mutable state before updating.
  const { data: record, error: fetchError } = await db
    .from('transfer_hours')
    .select('id, status')
    .eq('id', requestId)
    .single();

  if (fetchError || !record) throw new Error('Transfer hours request not found');
  if (record.status !== 'pending' && record.status !== 'needs_review') {
    throw new Error(`Cannot approve a request with status: ${record.status}`);
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

  if (error) throw new Error('Operation failed');

  await logAdminAudit({
    action: AdminAction.HOURS_TRANSFER_PROCESSED,
    actorId: user.id,
    entityType: 'transfer_hours',
    entityId: requestId,
    metadata: { decision: 'approved', hours_approved: hoursApproved },
  });

  revalidatePath('/admin/transfer-hours');
}

export async function denyTransferHours(requestId: string, notes?: string) {
  const { user, db } = await requireAdminActor();

  // Confirm the record exists and is in a mutable state before updating.
  const { data: record, error: fetchError } = await db
    .from('transfer_hours')
    .select('id, status')
    .eq('id', requestId)
    .single();

  if (fetchError || !record) throw new Error('Transfer hours request not found');
  if (record.status !== 'pending' && record.status !== 'needs_review') {
    throw new Error(`Cannot deny a request with status: ${record.status}`);
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

  if (error) throw new Error('Operation failed');

  await logAdminAudit({
    action: AdminAction.HOURS_TRANSFER_PROCESSED,
    actorId: user.id,
    entityType: 'transfer_hours',
    entityId: requestId,
    metadata: { decision: 'denied' },
  });

  revalidatePath('/admin/transfer-hours');
}
