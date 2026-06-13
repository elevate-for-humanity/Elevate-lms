'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function updateInstructorProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const full_name = (formData.get('full_name') as string)?.trim() || null;
  const title = (formData.get('title') as string)?.trim() || null;
  const phone = (formData.get('phone') as string)?.trim() || null;
  const bio = (formData.get('bio') as string)?.trim() || null;

  await supabase
    .from('profiles')
    .update({
      full_name,
      title,
      phone,
      bio,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  revalidatePath('/admin/instructor/settings');
}
