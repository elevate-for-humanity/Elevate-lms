'use server';

/** Server actions for admin user management. */
import { createClient } from '@/lib/supabase/server';
import { writeAdminAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

async function requireAdminActor() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error('Unauthorized');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, email, full_name')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || !profile) throw new Error('Unauthorized');
  if (!['admin', 'super_admin', 'staff', 'org_admin'].includes(profile.role)) throw new Error('Forbidden');
  return { supabase, actor: profile };
}

export async function activateUser(userId: string) {
  const { supabase } = await requireAdminActor();
  const { data: target } = await supabase
    .from('profiles').select('id, email, full_name, is_active').eq('id', userId).maybeSingle();
  if (!target) throw new Error('User not found');

  const { error } = await supabase
    .from('profiles').update({ is_active: true, updated_at: new Date().toISOString() }).eq('id', userId);
  if (error) throw new Error('Failed to activate user');

  await writeAdminAuditEvent(supabase, {
    action: 'user.activate',
    target_type: 'user',
    target_id: userId,
    metadata: { email: target.email },
  });
  revalidatePath('/users');
  return { success: true };
}

export async function deactivateUser(userId: string) {
  const { supabase, actor } = await requireAdminActor();
  const { data: target } = await supabase
    .from('profiles').select('id, email, full_name, is_active').eq('id', userId).maybeSingle();
  if (!target) throw new Error('User not found');
  if (actor.id === userId) throw new Error('Cannot deactivate your own account');

  const { error } = await supabase
    .from('profiles').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', userId);
  if (error) throw new Error('Failed to deactivate user');

  await writeAdminAuditEvent(supabase, {
    action: 'user.deactivate',
    target_type: 'user',
    target_id: userId,
    metadata: { email: target.email },
  });
  revalidatePath('/users');
  return { success: true };
}

export async function deleteUser(userId: string) {
  const { supabase, actor } = await requireAdminActor();
  const { data: target } = await supabase
    .from('profiles').select('id, email, full_name').eq('id', userId).maybeSingle();
  if (!target) throw new Error('User not found');
  if (actor.id === userId) throw new Error('Cannot delete your own account');

  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw new Error('Failed to delete user');

  await writeAdminAuditEvent(supabase, {
    action: 'user.delete',
    target_type: 'user',
    target_id: userId,
    metadata: { email: target.email },
  });
  revalidatePath('/users');
  return { success: true };
}
