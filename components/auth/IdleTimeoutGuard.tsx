'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { initIdleTimeout } from '@/lib/auth/idle-timeout';

/**
 * Monitors user activity and signs out after 30 minutes of inactivity.
 * Place this component in layouts for authenticated routes.
 */
export function IdleTimeoutGuard() {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const cleanup = initIdleTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = '/login?reason=idle';
    });

    return cleanup;
  }, []);

  return null;
}
