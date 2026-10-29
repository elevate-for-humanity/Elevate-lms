import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { createBrowserAuthFetch } from '@/lib/supabase/browser-auth-fetch';
import { timedFetch } from '@/lib/supabase/timed-fetch';

/** Recovery must attach session cookies to the final redirect response. */
export function createRecoveryClient(
  config: { url: string; anonKey: string },
  cookies: CookieMethodsServer,
) {
  return createServerClient(config.url, config.anonKey, {
    global: { fetch: createBrowserAuthFetch(config.url, { fetchImpl: timedFetch }) },
    cookies,
  });
}
