'use client';

import React from 'react';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Global scroll unlock fail-safe
 * Ensures scroll is always enabled on route changes
 * Prevents "stuck scroll" from modals, videos, or other components
 */
export default function ScrollUnlocker() {
  const pathname = usePathname();

  useEffect(() => {
    // Force scroll to be enabled on route changes (failsafe)
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
  }, [pathname]);

  return null;
}
