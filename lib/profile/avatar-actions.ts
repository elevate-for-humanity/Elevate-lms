'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_AVATAR_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function uploadProfileAvatar(file: File) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in again before uploading your profile photo.' };

  if (!ALLOWED_AVATAR_TYPES.has(file.type) || file.size > MAX_AVATAR_BYTES) {
    return { error: 'Choose a JPG, PNG, or WebP image no larger than 2 MB.' };
  }

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const objectPath = `${user.id}/profile-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(objectPath, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: `Photo upload failed: ${uploadError.message}` };

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(objectPath);
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select('id')
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.storage.from('avatars').remove([objectPath]);
    return { error: 'The photo uploaded, but the profile record could not be updated.' };
  }

  revalidatePath('/account/profile');
  revalidatePath('/lms/profile');
  revalidatePath('/lms/settings/profile');
  revalidatePath('/program-holder/dashboard');
  revalidatePath('/program-holder/settings');
  revalidatePath('/employer/dashboard');
  revalidatePath('/apprentice/dashboard');
  return { success: true, url: publicUrl };
}
