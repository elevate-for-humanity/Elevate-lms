'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';

export async function updateUserProfile(userId: string, updates: {
  full_name?: string; email?: string; role?: string; is_active?: boolean;
}) {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { data, error } = await db.from('profiles').update({
    ...updates,
    updated_at: new Date().toISOString(),
  }).eq('id', userId).select().single();

  if (error) return { error: 'Failed to update user' };

  await writeAdminAuditEvent(supabase, {
    action: AuditActions.USER_UPDATED,
    target_type: 'profile',
    target_id: userId,
    metadata: { role: updates.role, is_active: updates.is_active },
  });

  return { data };
}

export async function deactivateUser(userId: string) {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { error } = await db.from('profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: 'Failed to deactivate user' };

  await writeAdminAuditEvent(supabase, {
    action: AuditActions.USER_UPDATED,
    target_type: 'profile',
    target_id: userId,
    metadata: { status_change: 'deactivated' },
  });

  return { success: true };
}

export async function activateUser(userId: string) {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const { error } = await db.from('profiles')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: 'Failed to activate user' };

  await writeAdminAuditEvent(supabase, {
    action: AuditActions.USER_UPDATED,
    target_type: 'profile',
    target_id: userId,
    metadata: { status_change: 'activated' },
  });

  return { success: true };
}

export async function deleteUser(userId: string) {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  await writeAdminAuditEvent(supabase, {
    action: AuditActions.USER_DELETED,
    target_type: 'profile',
    target_id: userId,
  });

  const { error } = await db.from('profiles').delete().eq('id', userId);
  if (error) return { error: 'Failed to delete user' };

  return { success: true };
}
