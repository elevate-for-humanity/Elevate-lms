'use client';

import React from 'react';

import { useEffect } from 'react';
import { initSentry } from '@/lib/monitoring/sentry';

export function SentryInit() {
  useEffect(() => {
    initSentry();
  }, []);

  return null;
}

// Default export for next/dynamic
export default SentryInit;
