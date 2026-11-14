import { getServerPublicSupabaseConfig } from '@/lib/supabase/public-config';

/**
 * Injects Supabase public credentials for the browser when they exist at request time
 * (Node runtime) but were missing during `next build`.
 */
export function SupabasePublicConfigScript() {
  const config = getServerPublicSupabaseConfig();
  if (!config) return null;

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `window.__EFH_SUPABASE_PUBLIC__=${JSON.stringify(config)};`,
      }}
    />
  );
}
