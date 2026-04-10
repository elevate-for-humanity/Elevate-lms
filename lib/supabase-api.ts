/** @deprecated Import from '@/lib/supabase/server' instead. */
import { getAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

/** @deprecated Use await getAdminClient() from '@/lib/supabase/admin' instead. */
export function createSupabaseClient(): SupabaseClient<any> {
  return getAdminClient();
}
