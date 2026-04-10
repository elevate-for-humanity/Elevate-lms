/** @deprecated Use '@/lib/supabase/admin' instead. */
import { getAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — evaluated on first access, not at module load time.
let _client: SupabaseClient<any> | null = null;

/** @deprecated Use await getAdminClient() from '@/lib/supabase/admin' instead. */
export const supabaseAdmin: SupabaseClient<any> = new Proxy({} as SupabaseClient<any>, {
  get(_target, prop) {
    if (!_client) _client = await getAdminClient();
    return (_client as any)[prop];
  },
});
