'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createProgram(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
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

  const { error } = await supabase
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

  revalidatePath('/admin/programs');
  redirect('/admin/programs');
}

export async function updateProgram(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
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

  const { error } = await supabase
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

  revalidatePath('/admin/programs');
  redirect('/admin/programs');
}

export async function deleteProgram(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Operation failed');
  }

  revalidatePath('/admin/programs');
}
