'use client';
import { logger } from '@/lib/logger';

import React from 'react';
import { useEffect } from 'react';
export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Monitor Core Web Vitals
    const reportWebVitals = (data: any) => {
      //
      // Send to analytics
      if (window.gtag) {
        window.gtag('event', metric.name, {
          value: Math.round(metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        });
      }
    };
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          reportWebVitals({
            name: 'LCP',
            value: lastEntry.startTime,
            id: 'lcp',
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        logger.error('Error:', e);
      }
    }
    // FID - First Input Delay
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            reportWebVitals({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              id: 'fid',
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        logger.error('Error:', e);
      }
    }
    // CLS - Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as string).hadRecentInput) {
              clsValue += (entry as string).value;
              reportWebVitals({
                name: 'CLS',
                value: clsValue,
                id: 'cls',
              });
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        logger.error('Error:', e);
      }
    }
  }, []);
  return null;
}
