/** @deprecated Use '@/lib/supabase/server' instead. */
import { getAdminClient } from '@/lib/supabase/admin';

/** @deprecated Use await getAdminClient() from '@/lib/supabase/admin' instead. */
export function supabaseServer() {
  return getAdminClient();
}
