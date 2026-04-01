/** @deprecated Use '@/lib/supabase/admin' instead. */
// lib/getSupabaseServerClient.ts
import { createAdminClient } from '@/lib/supabase/admin';

export function getSupabaseServerClient() {
  return createAdminClient();
}
