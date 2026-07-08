'use client';

import { useEffect } from 'react';
import { checkVersionMismatch, APP_VERSION } from '@/lib/version-check';

export function VersionGuard() {
  useEffect(() => {
    // Record the current version so future loads can detect a change.
    // Do NOT hard-reload — the SW handles cache invalidation on deploy.
    // A forced reload here caused a double page load on every new deploy.
    const version = APP_VERSION;
    checkVersionMismatch();
  }, []);

  return null;
}

// Default export for next/dynamic
export default VersionGuard;
