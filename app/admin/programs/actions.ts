'use server';

import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

export async function createProgram(formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
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

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const duration_hours = formData.get('duration_hours') as string;
  const price = formData.get('price') as string;
  const requirements = formData.get('requirements') as string;
  const outcomes = formData.get('outcomes') as string;
  const is_active = formData.get('is_active') === 'on';
  const featured = formData.get('featured') === 'on';

  const { error } = await db
    .from('programs')
    .insert({
      name,
      slug,
      description,
      category,
      duration_hours: duration_hours ? parseInt(duration_hours) : null,
      price: price ? parseFloat(price) : null,
      requirements,
      outcomes,
      is_active,
      featured,
    });

  if (error) {
    throw new Error('Operation failed');
  }

  await logAdminAudit({ action: AdminAction.PROGRAM_CREATED, actorId: user.id, entityType: 'programs', entityId: BULK_ENTITY_ID, metadata: { name, slug } });

  revalidatePath('/admin/programs');
  redirect('/admin/programs');
}

export async function updateProgram(id: string, formData: FormData) {
  const supabase = await createClient();
  const db = await getAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: existing } = await db.from('programs').select('id').eq('id', id).single();
  if (!existing) throw new Error('Program not found');

  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const duration_hours = formData.get('duration_hours') as string;
  const price = formData.get('price') as string;
  const requirements = formData.get('requirements') as string;
  const outcomes = formData.get('outcomes') as string;
  const is_active = formData.get('is_active') === 'on';
  const featured = formData.get('featured') === 'on';

  const { error } = await db
    .from('programs')
    .update({
      name,
      slug,
      description,
      category,
      duration_hours: duration_hours ? parseInt(duration_hours) : null,
      price: price ? parseFloat(price) : null,
      requirements,
      outcomes,
      is_active,
      featured,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error('Operation failed');
  }

  await logAdminAudit({ action: AdminAction.PROGRAM_UPDATED, actorId: user.id, entityType: 'programs', entityId: id, metadata: { name } });

  revalidatePath('/admin/programs');
  redirect('/admin/programs');
}

export async function deleteProgram(id: string) {
  const supabase = await createClient();
  const db = await getAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') throw new Error('Unauthorized');

  const { data: existing } = await db.from('programs').select('id').eq('id', id).single();
  if (!existing) throw new Error('Program not found');

  const { error } = await db
    .from('programs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Operation failed');
  }

  await logAdminAudit({ action: AdminAction.PROGRAM_DELETED, actorId: user.id, entityType: 'programs', entityId: id, metadata: {} });

  revalidatePath('/admin/programs');
}
