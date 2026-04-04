'use server';

import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { approveApplication as runApprovalPipeline } from '@/lib/enrollment/approve';

/**
 * Server action: approve a single application.
 *
 * Wraps lib/enrollment/approve.ts — the single canonical approval pipeline.
 * Called from the admin applications table via form action.
 */
export async function approveApplication(id: string): Promise<void> {
  // Verify the caller is an authenticated admin
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff', 'org_admin'].includes(profile.role)) {
    throw new Error('Forbidden');
  }

  const db = createAdminClient();
  const result = await runApprovalPipeline(db, { applicationId: id });

  if (!result.success) {
    logger.error('[admin/applications/actions] approveApplication failed', { id, error: result.error });
    throw new Error(result.error ?? 'Approval failed');
  }

  logger.info('[admin/applications/actions] approved', { id, userId: result.userId });
  revalidatePath('/admin/applications');
}

/**
 * Server action: reject an application.
 */
export async function rejectApplication(id: string): Promise<void> {
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await userSupabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff', 'org_admin'].includes(profile.role)) {
    throw new Error('Forbidden');
  }

  const db = createAdminClient();

  // Confirm the application exists and is in a rejectable state before mutating.
  const { data: record, error: fetchError } = await db
    .from('applications')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchError || !record) throw new Error('Application not found');
  if (record.status === 'rejected') throw new Error('Application already rejected');

  const { error } = await db
    .from('applications')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    logger.error('[admin/applications/actions] rejectApplication failed', { id });
    throw new Error('Failed to reject application');
  }

  logger.info('[admin/applications/actions] rejected', { id });
  revalidatePath('/admin/applications');
}
