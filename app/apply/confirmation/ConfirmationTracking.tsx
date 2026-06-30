'use client';

import { useEffect } from 'react';

/**
 * Client-side tracking pixel for application confirmation page.
 * Fires once on mount — no visible UI.
 */
export default function ConfirmationTracking() {
  useEffect(() => {
    // Fire conversion event if analytics is available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'application_submitted', {
        event_category: 'enrollment',
        event_label: 'confirmation',
      });
    }
  }, []);

  return null;
}
