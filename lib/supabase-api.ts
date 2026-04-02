/** @deprecated Import from '@/lib/supabase/server' instead. */
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

/** @deprecated Use createAdminClient() from '@/lib/supabase/admin' instead. */
export function createSupabaseClient(): SupabaseClient<any> {
  return createAdminClient();
}
