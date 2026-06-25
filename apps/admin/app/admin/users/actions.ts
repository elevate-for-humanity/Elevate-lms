'use server';

/**
 * Server actions for admin user management.
 *
 * Integrity contracts (verified by tests/unit/admin/users-actions-integrity.test.ts):
 *  - Every mutation pre-reads the target profile before acting (User not found guard)
 *  - deactivateUser blocks self-deactivation via actorId check
 *  - deleteUser blocks self-deletion via actorId check
 *  - Audit log is written after the mutation, not before
 *  - Raw auth/profile errors are not exposed to callers
 */

import { createClient } from '@/lib/supabase/server';
import { writeAdminAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

// ── Internal helpers ──────────────────────────────────────────────────────────

async function requireAdminActor() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    // Do not expose raw error messages to callers
    throw new Error('Unauthorized');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, email, full_name')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    // Do not expose raw error messages to callers
    throw new Error('Unauthorized');
  }

  if (!['admin', 'staff', 'org_admin'].includes(profile.role)) {
    throw new Error('Forbidden');
  }

  return { supabase, actor: profile };
}

// ── activateUser ──────────────────────────────────────────────────────────────

export async function activateUser(userId: string) {
  const { supabase, actor } = await requireAdminActor();

  // Pre-read target — reject nonexistent users
  const { data: target } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (!target) throw new Error('User not found');

  await supabase
    .from('profiles')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', userId);

  await writeAdminAuditEvent(supabase, {
    action: 'user.activate',
    actor_id: actor.id,
    target_id: userId,
    metadata: { email: target.email },
  });

  revalidatePath('/admin/users');
  return { success: true };
}

// ── deactivateUser ────────────────────────────────────────────────────────────

export async function deactivateUser(userId: string) {
  const { supabase, actor } = await requireAdminActor();
  const actorId = actor.id;

  // Pre-read target — reject nonexistent users
  const { data: target } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (!target) throw new Error('User not found');

  // Block self-deactivation
  if (actorId === userId) throw new Error('Cannot deactivate your own account');

  await supabase
    .from('profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', userId);

  await writeAdminAuditEvent(supabase, {
    action: 'user.deactivate',
    actor_id: actorId,
    target_id: userId,
    metadata: { email: target.email },
  });

  revalidatePath('/admin/users');
  return { success: true };
}

// ── deleteUser ────────────────────────────────────────────────────────────────

export async function deleteUser(userId: string) {
  const { supabase, actor } = await requireAdminActor();
  const actorId = actor.id;

  // Pre-read target — reject nonexistent users
  const { data: target } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', userId)
    .maybeSingle();

  if (!target) throw new Error('User not found');

  // Block self-deletion
  if (actorId === userId) throw new Error('Cannot delete your own account (self)');

  await supabase.from('profiles').delete().eq('id', userId);

  // Audit log written after the delete, not before
  await writeAdminAuditEvent(supabase, {
    action: 'user.delete',
    actor_id: actorId,
    target_id: userId,
    metadata: { email: target.email },
  });

  revalidatePath('/admin/users');
  return { success: true };
}
