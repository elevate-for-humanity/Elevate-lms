/** @deprecated Use '@/lib/supabase/client' instead. */
import { createBrowserClient } from '@supabase/ssr';

// Use Content values during build if env vars are missing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'Content-key';

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
);

// Helper function for client components (replaces createClientComponentClient)
export function createClientComponentClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
