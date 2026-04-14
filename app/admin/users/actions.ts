'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { writeAdminAuditEvent, AuditActions } from '@/lib/audit';

async function requireAdminActor() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error('Auth failed');
  if (!user) throw new Error('Not authenticated');
  const db = await getAdminClient();
  const { data: profile, error: profileError } = await db
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profileError) throw new Error('Profile fetch failed');
  if (!['admin', 'super_admin'].includes(profile?.role ?? '')) throw new Error('Forbidden');
  return { supabase, db, actorId: user.id };
}

export async function updateUserProfile(userId: string, updates: {
  full_name?: string; email?: string; role?: string; is_active?: boolean;
}) {
  const { supabase, db } = await requireAdminActor();

  // .select().single() returns error if row doesn't exist — pre-read implicit.
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
  const { supabase, db, actorId } = await requireAdminActor();

  // Confirm user exists before mutating.
  const { data: target, error: fetchError } = await db
    .from('profiles').select('id, is_active').eq('id', userId).maybeSingle();
  if (fetchError || !target) return { error: 'User not found' };
  if (target.is_active === false) return { error: 'User is already inactive' };

  const { error } = await db.from('profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: 'Failed to deactivate user' };

  await writeAdminAuditEvent(supabase, {
    action: AuditActions.USER_UPDATED,
    target_type: 'profile',
    target_id: userId,
    metadata: { status_change: 'deactivated', actor_id: actorId },
  });

  return { success: true };
}

export async function activateUser(userId: string) {
  const { supabase, db, actorId } = await requireAdminActor();

  // Confirm user exists before mutating.
  const { data: target, error: fetchError } = await db
    .from('profiles').select('id, is_active').eq('id', userId).maybeSingle();
  if (fetchError || !target) return { error: 'User not found' };
  if (target.is_active === true) return { error: 'User is already active' };

  const { error } = await db.from('profiles')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) return { error: 'Failed to activate user' };

  await writeAdminAuditEvent(supabase, {
    action: AuditActions.USER_UPDATED,
    target_type: 'profile',
    target_id: userId,
    metadata: { status_change: 'activated', actor_id: actorId },
  });

  return { success: true };
}

export async function deleteUser(userId: string) {
  const { supabase, db, actorId } = await requireAdminActor();

  // Prevent self-deletion.
  if (userId === actorId) return { error: 'Cannot delete your own account' };

  // Confirm user exists before deleting.
  const { data: target, error: fetchError } = await db
    .from('profiles').select('id').eq('id', userId).maybeSingle();
  if (fetchError || !target) return { error: 'User not found' };

  const { error } = await db.from('profiles').delete().eq('id', userId);
  if (error) return { error: 'Failed to delete user' };

  // Audit log written after confirmed delete, not before.
  await writeAdminAuditEvent(supabase, {
    action: AuditActions.USER_DELETED,
    target_type: 'profile',
    target_id: userId,
    metadata: { actor_id: actorId },
  });

  return { success: true };
}
