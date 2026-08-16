import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { getServerPublicSupabaseConfig } from '@/lib/supabase/public-config';

type CookieMutation = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export function createMiddlewareSupabaseClient(
  request: NextRequest,
  setAll: (cookies: CookieMutation[]) => void,
) {
  const config = getServerPublicSupabaseConfig();
  if (!config) throw new Error('Supabase public configuration is unavailable');

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll,
    },
  });
}
