'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { initIdleTimeout } from '@/lib/auth/idle-timeout';

/**
 * Monitors user activity and signs out after the configured idle timeout.
 * Timeout is read from platform_settings (session_timeout key, in minutes)
 * and passed from the server layout. Defaults to 30 minutes.
 */
export function IdleTimeoutGuard({ timeoutMs = 30 * 60 * 1000 }: { timeoutMs?: number }) {
  useEffect(() => {
    const supabase = createBrowserClient();

    const cleanup = initIdleTimeout(async () => {
      await supabase.auth.signOut();
      window.location.href = '/login?reason=idle';
    }, timeoutMs);

    return cleanup;
  }, [timeoutMs]);

  return null;
}
