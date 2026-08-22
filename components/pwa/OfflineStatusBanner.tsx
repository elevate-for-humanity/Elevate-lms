'use client';

import { useEffect, useState } from 'react';

export function OfflineStatusBanner({ mode }: { mode: 'admin' | 'lms' }) {
  const [online, setOnline] = useState(true);
  const [controlled, setControlled] = useState(false);

  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      setControlled(Boolean(navigator.serviceWorker?.controller));
    };
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    navigator.serviceWorker?.addEventListener('controllerchange', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      navigator.serviceWorker?.removeEventListener('controllerchange', update);
    };
  }, []);

  if (online) return null;

  return (
    <div role="status" aria-live="polite" className="sticky top-0 z-[70] border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-950">
      {mode === 'admin'
        ? 'Offline mode: sensitive Admin records are not cached. Reconnect to load or change participant data.'
        : controlled
          ? 'Offline mode: installed LMS shell is active. Supported attendance actions can be saved for server verification when you reconnect.'
          : 'Offline mode: reconnect to restore the LMS. Install the dashboard while online for offline shell support.'}
    </div>
  );
}
