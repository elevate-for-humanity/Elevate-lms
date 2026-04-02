/** @deprecated Use '@/lib/supabase/client' instead. */
import { createBrowserClient } from '@/lib/supabase/client';

/** @deprecated Use createBrowserClient() from '@/lib/supabase/client' instead. */
export function getSupabase() {
  return createBrowserClient();
}

/** @deprecated */
export const supabase = null;
