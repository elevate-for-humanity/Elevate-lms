'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  // Use session client — RLS enforces row ownership on profiles.
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth failed: ${authError.message}`);
  if (!user) return { error: 'Not authenticated' };

  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const phone = formData.get('phone') as string;
  const bio = formData.get('bio') as string;

  const { error } = await supabase
    .from('profiles')
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      bio: bio,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { error: 'Operation failed' };
  }

  revalidatePath('/lms/profile');
  return { success: true };
}

export async function updateProfilePhoto(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`Auth failed: ${authError.message}`);
  if (!user) return { error: 'Not authenticated' };

  const file = formData.get('photo') as File;
  if (!file || file.size === 0) {
    return { error: 'No file provided' };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/lms/profile');
  return { success: true, url: publicUrl };
}
