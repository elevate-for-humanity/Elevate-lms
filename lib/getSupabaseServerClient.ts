/** @deprecated Use '@/lib/supabase/admin' instead. */
// lib/getSupabaseServerClient.ts
import { createAdminClient } from '@/lib/supabase/admin';

export function getSupabaseServerClient() {
  const client = createAdminClient();
  if (!client) {
    // Return a no-op client rather than throwing — throwing crashes lambdas on cold start
    const { createClient } = require('@supabase/supabase-js');
    return createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false },
    });
  }
  return client;
}
