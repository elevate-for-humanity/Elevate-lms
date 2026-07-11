import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Build-safe: lazily create the Supabase client at runtime, not at module load.
// This prevents "supabaseKey is required" errors during Next.js static build.
let _db: SupabaseClient<any> | null = null;

export function getDb(): SupabaseClient<any> {
  if (!_db) {
    _db = createClient();
  }
  return _db;
}

// Re-export the client with a Proxy so synchronous usage patterns work.
// The underlying client is lazily initialized on first access.
export const db = new Proxy({} as SupabaseClient<any>, {
  get(target, prop) {
    return Reflect.get(getDb(), prop);
  },
});
