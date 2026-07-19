'use server';

import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleDirectoryField(key: string, value: boolean) {
  const adminClient = await requireAdminClient();
  const fallback = await createClient();
  const db = adminClient ?? fallback;

  await db.from('platform_settings').upsert({ key, value: String(value) }, { onConflict: 'key' });

  revalidatePath('/admin/ferpa/directory-info');
}
