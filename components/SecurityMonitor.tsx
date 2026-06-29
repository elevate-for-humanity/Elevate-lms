'use client';
import { log } from '@/lib/logger';

import React from 'react';

import { useEffect } from 'react';
import { logSecurityEventAction } from '@/lib/actions/security';

/**
 * Security Monitor Component
 * Monitors and logs security events in real-time
 */
export function SecurityMonitor() {
  useEffect(() => {
    // Safety check - only run in browser
    if (typeof window === 'undefined') return;

    // 1. Monitor for suspicious activity
    let pageViews = 0;
    let lastView = Date.now();

    const trackPageView = () => {
      const now = Date.now();
      if (now - lastView < 1000) {
        pageViews++;
        if (pageViews > 10) {
          logSecurityEvent('RAPID_NAVIGATION', {
            count: pageViews,
            timeWindow: now - lastView,
          });
        }
      } else {
        pageViews = 0;
      }
      lastView = now;
    };

    window.addEventListener('popstate', trackPageView);

    // 2. Detect automated tools
    if (typeof navigator !== 'undefined') {
      const win = window as any;
      const indicators = {
        webdriver: !!navigator.webdriver,
        phantom: !!win._phantom || !!win.callPhantom,
        selenium: !!win.document?.$cdc_asdjflasutopfhvcZLmcfl_,
        headless: /HeadlessChrome/.test(navigator.userAgent),
      };

      if (Object.values(indicators).some((v) => v)) {
        logSecurityEvent('AUTOMATION_DETECTED', indicators);
      }
    }

    // 3. Detect DevTools opening
    const threshold = 160;
    let hasLogged = false;

    const check = () => {
      if (hasLogged) return;

      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;

      if (widthThreshold || heightThreshold) {
        hasLogged = true;
        logSecurityEvent('DEVTOOLS_OPENED', {
          outerWidth: window.outerWidth,
          innerWidth: window.innerWidth,
          outerHeight: window.outerHeight,
          innerHeight: window.innerHeight,
        });
      }
    };

    check();
    window.addEventListener('resize', check);

    // 4. Monitor for iframe embedding attempts
    if (window.self !== window.top) {
      logSecurityEvent('IFRAME_EMBEDDING_DETECTED', {
        parentOrigin: document.referrer,
      });

      try {
        window.top!.location.href = window.self.location.href;
      } catch (e) {
        log.error('Error:', e);
      }
    }

    // 5. Track failed resource loads
    const onError = (e: ErrorEvent) => {
      const target = e.target as any;
      if (target && target.src) {
        logSecurityEvent('RESOURCE_LOAD_FAILED', {
          resource: target.src,
          type: target.tagName,
        });
      }
    };
    window.addEventListener('error', onError, true);

    // 6. Monitor for clipboard access
    if (typeof document !== 'undefined') {
      document.addEventListener('paste', (e) => {
        logSecurityEvent('CLIPBOARD_PASTE', {
          dataLength: e.clipboardData?.getData('text').length || 0,
        });
      });
    }

    // 7. Detect screen recording software
    if (typeof navigator !== 'undefined' && 'mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
      logSecurityEvent('SCREEN_RECORDING_API_AVAILABLE', {});
    }

    // Cleanup
    return () => {
      window.removeEventListener('popstate', trackPageView);
      window.removeEventListener('resize', check);
      window.removeEventListener('error', onError, true);
    };
  }, []);

  return null; // This component doesn't render anything
}

// Track logged routes to prevent spam (route-level guard)
const loggedRoutes = new Set<string>();
const eventCooldowns = new Map<string, number>();
const COOLDOWN_MS = 60000; // 1 minute cooldown per event type

// Clear old entries periodically to prevent memory leak
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (loggedRoutes.size > 100) {
      loggedRoutes.clear();
    }
    // Clean up old cooldowns
    const now = Date.now();
    for (const [key, timestamp] of eventCooldowns.entries()) {
      if (now - timestamp > COOLDOWN_MS * 2) {
        eventCooldowns.delete(key);
      }
    }
  }, 300000); // Every 5 minutes
}

/**
 * Log security events
 */
function logSecurityEvent(eventType: string, data: any) {
  // Safety checks for SSR
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  // Create unique key for this route + event (route-level guard)
  const routeKey = `${window.location.pathname}:${eventType}`;

  // Check if already logged for this route
  if (loggedRoutes.has(routeKey)) {
    // Already logged for this route
    return;
  }

  // Check cooldown - only log same event once per minute
  const eventKey = `${eventType}:${window.location.pathname}`;
  const lastLogged = eventCooldowns.get(eventKey);
  const now = Date.now();
  if (lastLogged && now - lastLogged < COOLDOWN_MS) {
    return; // Skip - too soon
  }

  // Mark as logged for this route
  loggedRoutes.add(routeKey);

  // Update cooldown
  eventCooldowns.set(eventKey, now);

  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    data,
  };

  // Fire-and-forget via server action (bypasses edge bot protection)
  logSecurityEventAction(event).catch(() => {
    /* silent fail */
  });

  // Also send to Google Analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'security_event', {
      event_category: 'Security',
      event_label: eventType,
      value: 1,
    });
  }
}

/**
 * Security Badge Component
 * Shows security status to users
 */
export function SecurityBadge() {
  // Only show on secure/application routes, not marketing pages
  // Removed from homepage to avoid "internal system" feel
  return null;
}
