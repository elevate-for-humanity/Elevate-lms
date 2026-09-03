'use client';

import { useEffect } from 'react';
import { setupGlobalErrorHandler } from '@/lib/client/error-handler';

/**
 * Global Error Handler Component
 * Sets up unhandled promise rejection and error handlers
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    setupGlobalErrorHandler();
  }, []);

  return null;
}
