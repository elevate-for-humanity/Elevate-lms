'use server';

import { createClient } from '@/lib/supabase/server';
import { writeAdminAuditEvent } from '@/lib/audit';

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'staff']);

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Resolve the calling admin's user ID and verify their role.
 * Returns the actor's user ID or throws a generic error (no raw messages exposed).
 */
async function requireAdminActor(): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile?.role || !ADMIN_ROLES.has(profile.role)) {
    throw new Error('Forbidden');
  }

  return user.id;
}

// ── Exported actions ──────────────────────────────────────────────────────────

export async function activateUser(targetUserId: string): Promise<void> {
  const actorId = await requireAdminActor();
  const supabase = await createClient();

  // Pre-read target to confirm existence before mutating
  const { data: target } = await supabase
    .from('profiles')
    .select('id, is_active')
    .eq('id', targetUserId)
    .maybeSingle();

  if (!target) {
    throw new Error('User not found');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: true })
    .eq('id', targetUserId);

  if (error) {
    throw new Error('Failed to activate user');
  }

  await writeAdminAuditEvent(supabase, {
    action: 'user.activated',
    target_type: 'user',
    target_id: targetUserId,
    metadata: { actorId },
  });
}

export async function deactivateUser(targetUserId: string): Promise<void> {
  const actorId = await requireAdminActor();
  const supabase = await createClient();

  // Pre-read target to confirm existence before mutating
  const { data: target } = await supabase
    .from('profiles')
    .select('id, is_active')
    .eq('id', targetUserId)
    .maybeSingle();

  if (!target) {
    throw new Error('User not found');
  }

  // Block self-deactivation
  if (actorId === targetUserId) {
    throw new Error('Cannot deactivate your own account');
  }

  if (target.is_active === false) {
    throw new Error('User is already inactive');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_active: false })
    .eq('id', targetUserId);

  if (error) {
    throw new Error('Failed to deactivate user');
  }

  await writeAdminAuditEvent(supabase, {
    action: 'user.deactivated',
    target_type: 'user',
    target_id: targetUserId,
    metadata: { actorId },
  });
}

export async function deleteUser(targetUserId: string): Promise<void> {
  const actorId = await requireAdminActor();
  const supabase = await createClient();

  // Pre-read target to confirm existence before deleting
  const { data: target } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', targetUserId)
    .maybeSingle();

  if (!target) {
    throw new Error('User not found');
  }

  // Block self-deletion
  if (actorId === targetUserId) {
    throw new Error('Cannot delete your own account');
  }

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', targetUserId);

  if (error) {
    throw new Error('Failed to delete user');
  }

  await writeAdminAuditEvent(supabase, {
    action: 'user.deleted',
    target_type: 'user',
    target_id: targetUserId,
    metadata: { actorId },
  });
}
