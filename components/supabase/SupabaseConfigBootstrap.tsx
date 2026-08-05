'use client';

import { useEffect } from 'react';

/**
 * Ensures browser Supabase config is loaded when build-time NEXT_PUBLIC_* was placeholder.
 * Runs once on mount on every public page (including /login).
 */
export function SupabaseConfigBootstrap() {
  useEffect(() => {
    async function verifyConfig() {
      if (window.__EFH_SUPABASE_PUBLIC__) {
        return;
      }

      const response = await fetch('/api/public/supabase-config', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Supabase config request failed: ${response.status}`);
      }

      const config = await response.json();
      window.__EFH_SUPABASE_PUBLIC__ = config;
    }

    void verifyConfig().catch((error) => {
      console.error('[supabase-bootstrap] Initialization failed', error);
    });
  }, []);

  return null;
}

export default SupabaseConfigBootstrap;
