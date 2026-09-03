'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-16712632425';

type GtagFunction = (...args: unknown[]) => void;
type WindowWithGtag = Window & { gtag?: GtagFunction };

function getGtag(): GtagFunction | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as WindowWithGtag).gtag;
}

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="lazyOnload" />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = window.gtag || gtag;
          gtag('js', new Date());
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            send_page_view: true,
          });
          if ('${GOOGLE_ADS_ID}') {
            gtag('config', '${GOOGLE_ADS_ID}', { allow_enhanced_conversions: true });
          }

          try {
            var storedConsent = localStorage.getItem('cookie-consent');
            if (storedConsent === 'accepted') {
              gtag('consent', 'update', {
                analytics_storage: 'granted',
                ad_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted'
              });
            }
          } catch (_) {}
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

export function updateConsent(analyticsAllowed: boolean, adsAllowed = false) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag('consent', 'update', {
    analytics_storage: analyticsAllowed ? 'granted' : 'denied',
    ad_storage: adsAllowed ? 'granted' : 'denied',
    ad_user_data: adsAllowed ? 'granted' : 'denied',
    ad_personalization: adsAllowed ? 'granted' : 'denied',
  });
}

export default GoogleAnalytics;
