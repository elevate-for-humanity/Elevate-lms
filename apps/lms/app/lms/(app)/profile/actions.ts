'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const payload = {
    full_name: String(formData.get('full_name') || '').trim() || null,
    phone: String(formData.get('phone') || '').trim() || null,
    city: String(formData.get('city') || '').trim() || null,
    state: String(formData.get('state') || '').trim() || null,
    bio: String(formData.get('bio') || '').trim() || null,
  };

  await supabase.from('profiles').update(payload).eq('id', user.id);
  revalidatePath('/lms/profile');
  revalidatePath('/lms/settings/profile');
}
