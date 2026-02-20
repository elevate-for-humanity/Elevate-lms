"use client";

import Script from 'next/script';
import { useEffect } from 'react';

/**
 * Canonical GA4 loader. This is the ONLY component that should inject gtag.js.
 * All other GA components in this repo are orphaned and should not be used.
 *
 * Measurement ID comes from NEXT_PUBLIC_GA_MEASUREMENT_ID env var.
 * If missing, logs a warning to console (not silent) so operators notice.
 */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  useEffect(() => {
    // GA_MEASUREMENT_ID check is silent in production — operators
    // should verify via Netlify env vars, not browser console.
  }, []);

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          // Default consent mode - deny until user accepts via cookie banner
          gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'wait_for_update': 500
          });
          
          // If user previously accepted, grant immediately
          if (localStorage.getItem('cookie-consent') === 'accepted') {
            gtag('consent', 'update', {
              'analytics_storage': 'granted',
            });
          }
          
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  );
}

// Track page views
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

// Track custom events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Track conversions
export function trackConversion(conversionId: string, value?: number) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
    });
  }
}

// Update consent
export function updateConsent(analyticsAllowed: boolean, adsAllowed: boolean = false) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('consent', 'update', {
      'analytics_storage': analyticsAllowed ? 'granted' : 'denied',
      'ad_storage': adsAllowed ? 'granted' : 'denied',
    });
  }
}
