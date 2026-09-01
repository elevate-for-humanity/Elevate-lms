import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { getServerPublicSupabaseConfig } from '@/lib/supabase/public-config';

// A 2.5 second abort turned a transient Supabase slowdown into an anonymous
// session and sent authenticated portal users back to login while navigating.
// Keep the request bounded, but allow enough time for a rotated refresh token
// to be verified on a cold regional connection.
const MIDDLEWARE_SUPABASE_TIMEOUT_MS = 8_000;

async function middlewareFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  init?.signal?.addEventListener('abort', abortFromCaller, { once: true });
  const timer = setTimeout(() => controller.abort(), MIDDLEWARE_SUPABASE_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    init?.signal?.removeEventListener('abort', abortFromCaller);
  }
}

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
    global: { fetch: middlewareFetch },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll,
    },
  });
}
