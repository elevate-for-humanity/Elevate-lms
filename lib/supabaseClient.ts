/**
 * @deprecated Import from '@/lib/supabase/client' instead.
 *
 * Compatibility bridge for older client-side imports. This must never return
 * null because legacy callers expect a usable Supabase-compatible client.
 */
import { createBrowserClient } from '@/lib/supabase/client';

export function getSupabaseClient() {
  return createBrowserClient();
}

export const supabase = getSupabaseClient();
