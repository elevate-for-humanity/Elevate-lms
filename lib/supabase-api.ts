/** @deprecated Use '@/lib/supabase/server' instead. */
import { createClient } from '@supabase/supabase-js';

/**
 * Create Supabase client for API routes
 * This function should be called inside route handlers, not at module level
 * to avoid build-time errors when environment variables aren't available
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'Content-service-key';

  // Only throw error at runtime in production, not during build
  if ((!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) &&
      process.env.NODE_ENV === 'production' &&
      typeof window !== 'undefined') {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
