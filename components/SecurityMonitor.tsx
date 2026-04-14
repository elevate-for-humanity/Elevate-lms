"use client";

import React from 'react';

import { useEffect } from 'react';
import { logSecurityEventAction } from '@/app/actions/security';

/**
 * Security Monitor Component
 * Monitors and logs security events in real-time
 */
export function SecurityMonitor() {
  useEffect(() => {
    // Safety check - only run in browser
    if (typeof window === 'undefined') return;

    // 1. Monitor for suspicious activity
    const monitorActivity = () => {
      // Track rapid page navigation (potential scraping)
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

    // 2. Detect automated tools
    const detectAutomation = () => {
      if (typeof navigator === 'undefined') return;
      // Check for common automation indicators
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
    };

    // 3. Monitor console access - disabled for performance

    // 4. Detect DevTools opening (check once, not every second)
    const detectDevTools = () => {
      const threshold = 160;
      let hasLogged = false;
      
      const check = () => {
        if (hasLogged) return; // Only log once per session
        
        const widthThreshold =
          window.outerWidth - window.innerWidth > threshold;
        const heightThreshold =
          window.outerHeight - window.innerHeight > threshold;

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

      // Check on mount and on resize (not every second)
      check();
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    };

    // 5. Monitor for iframe embedding attempts
    const detectIframeEmbedding = () => {
      if (typeof document === 'undefined') return;
      if (window.self !== window.top) {
        logSecurityEvent('IFRAME_EMBEDDING_DETECTED', {
          parentOrigin: document.referrer,
        });

        // Attempt to break out of iframe
        try {
          window.top!.location = window.self.location;
        } catch (e) {
          // If we can't break out, at least log it
        }
      }
    };

    // 6. Track failed resource loads (potential tampering)
    const monitorResourceLoading = () => {
      window.addEventListener(
        'error',
        (e) => {
          const target = e.target as any;
          if (target && target.src) {
            logSecurityEvent('RESOURCE_LOAD_FAILED', {
              resource: target.src,
              type: target.tagName,
            });
          }
        },
        true
      );
    };

    // 7. Monitor for clipboard access
    const monitorClipboard = () => {
      if (typeof document === 'undefined') return;
      document.addEventListener('paste', (e) => {
        logSecurityEvent('CLIPBOARD_PASTE', {
          dataLength: e.clipboardData?.getData('text').length || 0,
        });
      });
    };

    // 8. Detect screen recording software
    const detectScreenRecording = () => {
      if (typeof navigator === 'undefined') return;
      if (
        'mediaDevices' in navigator &&
        'getDisplayMedia' in navigator.mediaDevices
      ) {
        // Screen recording API is available
        logSecurityEvent('SCREEN_RECORDING_API_AVAILABLE', {});
      }
    };

    // Initialize all monitors
    const cleanup1 = monitorActivity();
    detectAutomation();
    // monitorConsole() - disabled for performance
    const cleanup2 = detectDevTools();
    detectIframeEmbedding();
    monitorResourceLoading();
    monitorClipboard();
    detectScreenRecording();

    // Cleanup
    return () => {
      cleanup1();
      cleanup2();
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

  // Fire-and-forget via server action (bypasses Netlify edge bot protection)
  logSecurityEventAction(event).catch(() => { /* silent fail */ });

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
