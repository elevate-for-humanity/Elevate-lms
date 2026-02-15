import { logger } from '@/lib/logger';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Static Supabase client for build-time operations
 * Use this in generateStaticParams and other build-time functions
 */
export function createStaticClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'development') {
      logger.info(
        '[Supabase Static] Missing environment variables - returning mock client'
      );
    }
    // Return a mock client that returns empty data for build-time
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              then: (resolve: any) => resolve({ data: [], error: null }),
            }),
            single: () => ({
              then: (resolve: any) => resolve({ data: null, error: null }),
            }),
            then: (resolve: any) => resolve({ data: [], error: null }),
          }),
          then: (resolve: any) => resolve({ data: [], error: null }),
        }),
      }),
    } as any;
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
