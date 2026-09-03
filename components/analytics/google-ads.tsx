'use client';

/**
 * Sit Selfish Inc — Google tag IDs
 *   AW-16712632425  Google Ads conversion account
 *   GT-5N5RZZTD     Google Tag Manager container
 *
 * Both tags are loaded on every page. Conversion events are fired via
 * trackAdsConversion() on success/thank-you pages.
 */

export const GOOGLE_ADS_ID = 'AW-16712632425';
export const GOOGLE_TAG_ID = 'GT-5N5RZZTD';

// Conversion action labels — update labels after creating actions in Google Ads:
//   Goals → Conversions → New conversion action → Website
export const CONVERSION_ACTIONS = {
  ENROLL: `${GOOGLE_ADS_ID}/enroll_application`,
  DONATE: `${GOOGLE_ADS_ID}/donate_complete`,
  CONTACT: `${GOOGLE_ADS_ID}/contact_form`,
} as const;

export function GoogleAds() {
  // Canonical gtag injection/config happens in components/analytics/google-analytics.tsx.
  // Keep this component as a harmless compatibility mount point.
  return null;
}

/**
 * Fire a Google Ads conversion event.
 * Call this on the thank-you / success page after the action completes.
 *
 * @param action  - one of CONVERSION_ACTIONS
 * @param value   - dollar value of the conversion (optional)
 * @param currency - defaults to USD
 */
export function trackAdsConversion(
  action: string,
  value?: number,
  currency: string = 'USD',
) {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: Gtag.Gtag }).gtag;
  if (typeof gtag !== 'function') return;

  gtag('event', 'conversion', {
    send_to: action,
    ...(value !== undefined && { value, currency }),
  });
}

// Default export for next/dynamic
export default GoogleAds;
