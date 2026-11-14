'use client';

import React from 'react';

import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch('/api/offline/sync', { method: 'POST' });
    } finally {
      setSyncing(false);
    }
  }

  if (online) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between bg-amber-500 px-4 py-2 text-xs text-white shadow-lg">
      <span>You're offline. You can keep working; changes will sync later.</span>
      <button
        onClick={handleSync}
        className="rounded-xl bg-white/10 px-3 py-2 text-[11px] font-semibold"
        disabled={syncing}
      >
        {syncing ? 'Syncing…' : 'Sync now'}
      </button>
    </div>
  );
}
