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
    const search = new URLSearchParams(window.location.search);
    const landing = window.sessionStorage.getItem(LANDING_KEY) || `${pathname}${window.location.search}`;
    if (!window.sessionStorage.getItem(LANDING_KEY)) window.sessionStorage.setItem(LANDING_KEY, landing);

    const payload = JSON.stringify({
      path: pathname,
      page: `${pathname}${window.location.search}`,
      session_id: getSessionId(),
      referrer: document.referrer || null,
      landing_path: landing,
      utm_source: search.get('utm_source'),
      utm_medium: search.get('utm_medium'),
      utm_campaign: search.get('utm_campaign'),
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/track', blob);
      return;
    }

    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      credentials: 'omit',
    });
  }, [pathname]);

  return null;
}
