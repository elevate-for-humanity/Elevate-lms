'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createModule(formData: FormData) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
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

  revalidatePath('/admin/modules');
  redirect('/admin/modules');
}

export async function updateModule(id: string, formData: FormData) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
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

  revalidatePath('/admin/modules');
  redirect('/admin/modules');
}

export async function deleteModule(id: string) {
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
    .from('modules')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Operation failed');
  }

  revalidatePath('/admin/modules');
}
