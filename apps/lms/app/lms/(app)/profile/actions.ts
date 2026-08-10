'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

export async function uploadAvatar(file: File) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
  revalidatePath('/lms/profile');
  revalidatePath('/lms/settings/profile');
  return { success: true, url: publicUrl };
}
