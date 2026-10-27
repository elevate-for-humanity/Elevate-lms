'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SESSION_KEY = 'efh_analytics_session';
const LANDING_KEY = 'efh_analytics_landing';

function getSessionId(): string {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, id);
  return id;
}

export function FirstPartyTraffic() {
  const pathname = usePathname();

  useEffect(() => {
    if (/^\/tax-software\/(office|self-file|login|careers)(\/|$)/.test(pathname || '')) return;
    // Optional analytics must not bring down the shared marketing layout when
    // privacy settings deny browser storage. Do not invent a tracking identity.
    let sessionId: string;
    let landing: string;
    try {
      sessionId = getSessionId();
      landing = window.sessionStorage.getItem(LANDING_KEY) || `${pathname}${window.location.search}`;
      if (!window.sessionStorage.getItem(LANDING_KEY))
        window.sessionStorage.setItem(LANDING_KEY, landing);
    } catch { return; }
    const search = new URLSearchParams(window.location.search);

    const payload = JSON.stringify({
      path: pathname,
      page: `${pathname}${window.location.search}`,
      session_id: sessionId,
      referrer: document.referrer || null,
      landing_path: landing,
      utm_source: search.get('utm_source'),
      utm_medium: search.get('utm_medium'),
      utm_campaign: search.get('utm_campaign'),
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      try { navigator.sendBeacon('/api/analytics/track', blob); } catch { /* Optional telemetry. */ }
      return;
    }

    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'omit',
    }).catch(() => { /* Optional telemetry cannot create an unhandled rejection. */ });
  }, [pathname]);

  return null;
}
