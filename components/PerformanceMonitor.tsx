'use client';

import React from 'react';

import { useEffect } from 'react';
import { initPerformanceMonitoring } from '@/lib/performance';

export function PerformanceMonitor() {
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);

  return null;
}
