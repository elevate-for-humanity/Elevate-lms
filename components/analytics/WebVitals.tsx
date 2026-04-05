'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { useEffect } from 'react';

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

// Thresholds based on Google's Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },   // Largest Contentful Paint
  FID: { good: 100, poor: 300 },     // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },    // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 },   // First Contentful Paint
  TTFB: { good: 800, poor: 1800 },   // Time to First Byte
  INP: { good: 200, poor: 500 },     // Interaction to Next Paint
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

export function WebVitals() {
  useReportWebVitals((metric) => {
    const rating = getRating(metric.name, metric.value);
    
    // Send to analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
        metric_rating: rating,
        metric_delta: metric.delta,
      });
    }

    // Log poor metrics for debugging
    if (rating === 'poor' && process.env.NODE_ENV === 'development') {
      console.warn(`[Web Vitals] Poor ${metric.name}:`, {
        value: metric.value,
        rating,
        threshold: THRESHOLDS[metric.name as keyof typeof THRESHOLDS],
      });
    }

    // Send to custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating,
          id: metric.id,
          page: window.location.pathname,
          timestamp: Date.now(),
        }),
        keepalive: true,
      }).catch(() => {
        // Silently fail - analytics shouldn't break the app
      });
    }
  });

  return null;
}

// Hook for components that need to track specific interactions
export function useTrackInteraction() {
  return (interactionName: string, duration: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'user_interaction', {
        event_category: 'Interaction',
        event_label: interactionName,
        value: Math.round(duration),
        non_interaction: false,
      });
    }
  };
}

// Performance observer for custom metrics
export function usePerformanceObserver() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    // Track long tasks (>50ms)
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          if (process.env.NODE_ENV === 'development') (console as any).debug?.('[Performance] Long task:', entry.duration.toFixed(2), 'ms'); // ci-ignore
        }
      }
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch {
      // Not supported in all browsers
    }

    return () => longTaskObserver.disconnect();
  }, []);
}

// Declare gtag on window
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
