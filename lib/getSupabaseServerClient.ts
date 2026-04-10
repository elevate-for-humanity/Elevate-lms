/** @deprecated Use '@/lib/supabase/admin' instead. */
// lib/getSupabaseServerClient.ts
import { getAdminClient } from '@/lib/supabase/admin';

export async function getSupabaseServerClient() {
  return getAdminClient();
}
