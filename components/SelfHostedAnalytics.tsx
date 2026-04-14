"use client";

import React from 'react';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Self-Hosted Analytics - 100% Free
 *
 * Tracks:
 * - Page views
 * - User sessions
 * - Performance metrics (Web Vitals)
 * - Custom events
 *
 * Data stored in Supabase (no external costs)
 */
function SelfHostedAnalyticsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page view
    trackPageView();

    // Track Web Vitals (performance)
    if (typeof window !== 'undefined' && 'web-vitals' in window) {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS(sendToAnalytics);
        onFID(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
      });
    }
  }, [pathname, searchParams]);

  const trackPageView = async () => {
    try {
      const data = {
        event: 'pageview',
        path: pathname,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        timestamp: new Date().toISOString(),
      };

      // Send to your own API endpoint
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch (error) { /* Error handled silently */ 
      // Silently fail - don't break the app
    }
  };

  const sendToAnalytics = async (metric: any) => {
    try {
      const payload = {
        event: 'web-vital',
        metric_name: metric.name,
        metric_value: metric.value,
        metric_id: metric.id,
        path: pathname,
        timestamp: new Date().toISOString(),
      };

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Silently fail — analytics must never break the app
    }
  };

  // No UI - just tracking
  return null;
}

/**
 * Custom event tracking hook
 * Usage: const trackEvent = useAnalytics();
 *        trackEvent('button_click', { button_name: 'signup' });
 */
export function useAnalytics() {
  return async (eventName: string, properties?: Record<string, any>) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          properties,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) { /* Error handled silently */ 
    // Error handled
  }
  };
}

export default function SelfHostedAnalytics() {
  return (
    <Suspense fallback={null}>
      <SelfHostedAnalyticsContent />
    </Suspense>
  );
}
