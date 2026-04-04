'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

export async function createModule(formData: FormData) {
  const supabase = await createClient();
  const db = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  const program_id = formData.get('program_id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const module_type = formData.get('module_type') as string;
  const order_index = formData.get('order_index') as string;
  const duration_hours = formData.get('duration_hours') as string;
  const is_required = formData.get('is_required') === 'on';

  const { error } = await db
    .from('modules')
    .insert({
      program_id,
      title,
      description,
      module_type,
      order_index: parseInt(order_index),
      duration_hours: duration_hours ? parseFloat(duration_hours) : null,
      is_required,
    });

  if (error) {
    throw new Error('Operation failed');
  }

  await logAdminAudit({ action: AdminAction.MODULE_CREATED, actorId: user.id, entityType: 'training_modules', entityId: BULK_ENTITY_ID, metadata: { title } });

  revalidatePath('/admin/modules');
  redirect('/admin/modules');
}

export async function updateModule(id: string, formData: FormData) {
  const supabase = await createClient();
  const db = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: existing } = await db.from('modules').select('id').eq('id', id).single();
  if (!existing) throw new Error('Module not found');

  const program_id = formData.get('program_id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const module_type = formData.get('module_type') as string;
  const order_index = formData.get('order_index') as string;
  const duration_hours = formData.get('duration_hours') as string;
  const is_required = formData.get('is_required') === 'on';

  const { error } = await db
    .from('modules')
    .update({
      program_id,
      title,
      description,
      module_type,
      order_index: parseInt(order_index),
      duration_hours: duration_hours ? parseFloat(duration_hours) : null,
      is_required,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error('Operation failed');
  }

  await logAdminAudit({ action: AdminAction.MODULE_UPDATED, actorId: user.id, entityType: 'training_modules', entityId: id, metadata: {} });

  revalidatePath('/admin/modules');
  redirect('/admin/modules');
}

export async function deleteModule(id: string) {
  const supabase = await createClient();
  const db = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') throw new Error('Unauthorized');

  const { data: existing } = await db.from('modules').select('id').eq('id', id).single();
  if (!existing) throw new Error('Module not found');

  const { error } = await db
    .from('modules')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Operation failed');
  }

  await logAdminAudit({ action: AdminAction.MODULE_DELETED, actorId: user.id, entityType: 'training_modules', entityId: id, metadata: {} });

  revalidatePath('/admin/modules');
}
