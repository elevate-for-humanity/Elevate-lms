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

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    return { error: 'Choose a JPG, PNG, or WebP image no larger than 5 MB.' };
  }
  const fileExt = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
  revalidatePath('/lms/profile');
  revalidatePath('/lms/settings/profile');
  return { success: true, url: publicUrl };
}
