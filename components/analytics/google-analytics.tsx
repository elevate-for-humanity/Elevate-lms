'use client';

import Script from 'next/script';
import { useEffect } from 'react';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-16712632425';

type GtagFunction = (...args: unknown[]) => void;
type WindowWithGtag = Window & { gtag?: GtagFunction };

function getGtag(): GtagFunction | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as WindowWithGtag).gtag;
}

export function GoogleAnalytics() {
  useEffect(() => {}, []);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="lazyOnload" />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
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

export function trackPageView(url: string) {
  const gtag = getGtag();
  if (!gtag || !GA_MEASUREMENT_ID) return;
  gtag('config', GA_MEASUREMENT_ID, { page_path: url });
}

export function trackEvent(action: string, category: string, label?: string, value?: number) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
}

export function trackConversion(conversionId: string, value?: number) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag('event', 'conversion', { send_to: conversionId, value });
}

export function updateConsent(analyticsAllowed: boolean, adsAllowed: boolean = false) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag('consent', 'update', {
    analytics_storage: analyticsAllowed ? 'granted' : 'denied',
    ad_storage: adsAllowed ? 'granted' : 'denied',
  });
}

export default GoogleAnalytics;
