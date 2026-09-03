'use client';
import { logger } from '@/lib/logger';

import React from 'react';

import { useEffect } from 'react';
import { logSecurityEventAction } from '@/lib/actions/security';
import type { Gtag } from '@/lib/types/external-sdks';

// Automation detection window interface
interface AutomationWindow {
  _phantom?: unknown;
  callPhantom?: unknown;
  document?: {
    $cdc_asdjflasutopfhvcZLmcfl_?: unknown;
  };
}

// Security event data type
interface SecurityEventData {
  count?: number;
  timeWindow?: number;
  webdriver?: boolean;
  phantom?: boolean;
  selenium?: boolean;
  headless?: boolean;
  outerWidth?: number;
  innerWidth?: number;
  outerHeight?: number;
  innerHeight?: number;
  parentOrigin?: string;
  resource?: string;
  type?: string;
  dataLength?: number;
  [key: string]: unknown;
}

/**
 * Security Monitor Component
 * Monitors and logs security events in real-time
 */
export function SecurityMonitor() {
  useEffect((): void => {
    if (typeof window === 'undefined') return;

    const monitorActivity = () => {
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
      return () => window.removeEventListener('popstate', trackPageView);
    };

    const detectAutomation = () => {
      if (typeof navigator === 'undefined') return;
      const win = window as unknown as AutomationWindow;
      const indicators = {
        webdriver: !!navigator.webdriver,
        phantom: !!win._phantom || !!win.callPhantom,
        selenium: !!win.document?.$cdc_asdjflasutopfhvcZLmcfl_,
        headless: /HeadlessChrome/.test(navigator.userAgent),
      };

      if (Object.values(indicators).some((v) => v)) {
        logSecurityEvent('AUTOMATION_DETECTED', indicators);
      }
    };

    const detectDevTools = () => {
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
      return () => window.removeEventListener('resize', check);
    };

    const detectIframeEmbedding = () => {
      if (typeof document === 'undefined') return;
      if (window.self !== window.top) {
        logSecurityEvent('IFRAME_EMBEDDING_DETECTED', {
          parentOrigin: document.referrer,
        });

        try {
          window.top!.location = window.self.location;
        } catch (e) {
          logger.error('Error:', e);
        }
      }
    };

    const monitorResourceLoading = () => {
      window.addEventListener(
        'error',
        (e) => {
          const target = e.target as HTMLElement & { src?: string };
          if (target && target.src) {
            logSecurityEvent('RESOURCE_LOAD_FAILED', {
              resource: target.src,
              type: target.tagName,
            });
          }
        },
        true,
      );
    };

    const monitorClipboard = () => {
      if (typeof document === 'undefined') return;
      document.addEventListener('paste', (e) => {
        logSecurityEvent('CLIPBOARD_PASTE', {
          dataLength: e.clipboardData?.getData('text').length || 0,
        });
      });
    };

    const detectScreenRecording = () => {
      if (typeof navigator === 'undefined') return;
      if ('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
        logSecurityEvent('SCREEN_RECORDING_API_AVAILABLE', {});
      }
    };

    const cleanup1 = monitorActivity();
    detectAutomation();
    const cleanup2 = detectDevTools();
    detectIframeEmbedding();
    monitorResourceLoading();
    monitorClipboard();
    detectScreenRecording();

    return () => {
      cleanup1?.();
      cleanup2?.();
    };
  }, []);

  return null;
}

// Track logged routes to prevent spam
const loggedRoutes = new Set<string>();
const eventCooldowns = new Map<string, number>();
const COOLDOWN_MS = 60000;

if (typeof window !== 'undefined') {
  setInterval(() => {
    if (loggedRoutes.size > 100) {
      loggedRoutes.clear();
    }
    const now = Date.now();
    for (const [key, timestamp] of eventCooldowns.entries()) {
      if (now - timestamp > COOLDOWN_MS * 2) {
        eventCooldowns.delete(key);
      }
    }
  }, 300000);
}

/**
 * Log security events
 */
function logSecurityEvent(eventType: string, data: SecurityEventData) {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  const routeKey = `${window.location.pathname}:${eventType}`;

  if (loggedRoutes.has(routeKey)) {
    return;
  }

  const eventKey = `${eventType}:${window.location.pathname}`;
  const lastLogged = eventCooldowns.get(eventKey);
  const now = Date.now();
  if (lastLogged && now - lastLogged < COOLDOWN_MS) {
    return;
  }

  loggedRoutes.add(routeKey);
  eventCooldowns.set(eventKey, now);

  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    data,
  };

  logSecurityEventAction(event).catch(() => {
    /* silent fail */
  });

  const gtag = (window as unknown as { gtag?: Gtag.Gtag }).gtag;
  if (typeof window !== 'undefined' && gtag) {
    gtag('event', 'security_event', {
      event_category: 'Security',
      event_label: eventType,
      value: 1,
    });
  }
}

/**
 * Security Badge Component
 */
export function SecurityBadge() {
  return null;
}

export default SecurityMonitor;
