/** @deprecated Use '@/lib/supabase/admin' instead. */
import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — evaluated on first access, not at module load time.
let _client: SupabaseClient<any> | null = null;

/** @deprecated Use createAdminClient() from '@/lib/supabase/admin' instead. */
export const supabaseAdmin: SupabaseClient<any> = new Proxy({} as SupabaseClient<any>, {
  get(_target, prop) {
    if (!_client) _client = createAdminClient();
    return (_client as any)[prop];
  },
});
