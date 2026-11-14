'use client';

import React from 'react';
import { useEffect } from 'react';
import {
  reportWebVitals,
  observePerformance,
  monitorResources,
} from '@/lib/performance/web-vitals';
export function PerformanceMonitor() {
  useEffect(() => {
    // Report web vitals
    reportWebVitals();
    // Observe performance
    observePerformance();
    // Monitor resources
    monitorResources();
    // Log performance metrics
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType(
          'navigation',
        )[0] as PerformanceNavigationTiming;
      });
    }
  }, []);
  return null;
}
