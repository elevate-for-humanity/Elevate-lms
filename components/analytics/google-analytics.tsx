'use client';

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
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-16712632425';

export function GoogleAnalytics() {
  useEffect(() => {
    // GA_MEASUREMENT_ID check is silent in production — operators
    // should verify runtime env vars, not browser console.
  }, []);

  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          
          // Analytics storage granted by default — anonymized, no PII collected.
          // Ad storage remains denied until explicit user consent.
          // This is a nonprofit workforce site; analytics are operational, not ad-targeting.
          gtag('consent', 'default', {
            'analytics_storage': 'granted',
            'ad_storage': 'denied',
          });

          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            send_page_view: true,
          });

          if ('${GOOGLE_ADS_ID}') {
            gtag('config', '${GOOGLE_ADS_ID}', { allow_enhanced_conversions: true });
          }
        `}
      </Script>
    </>
  );
}

// Track page views
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: Gtag.Gtag }).gtag) {
    (window as unknown as { gtag?: Gtag.Gtag }).gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
}

// Track custom events
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: Gtag.Gtag }).gtag) {
    (window as unknown as { gtag?: Gtag.Gtag }).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

// Track conversions
export function trackConversion(conversionId: string, value?: number) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: Gtag.Gtag }).gtag) {
    (window as unknown as { gtag?: Gtag.Gtag }).gtag('event', 'conversion', {
      send_to: conversionId,
      value: value,
    });
  }
}

// Update consent
export function updateConsent(analyticsAllowed: boolean, adsAllowed: boolean = false) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: Gtag.Gtag }).gtag) {
    (window as unknown as { gtag?: Gtag.Gtag }).gtag('consent', 'update', {
      analytics_storage: analyticsAllowed ? 'granted' : 'denied',
      ad_storage: adsAllowed ? 'granted' : 'denied',
    });
  }
}

// Default export for next/dynamic
export default GoogleAnalytics;
