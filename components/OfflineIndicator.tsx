"use client";

import React from 'react';

import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { SyncManager } from '@/lib/offline/sync';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Initial state
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);

      // Au banner after 3 seconds
      setTimeout(() => setShowBanner(false), 3000);

      // Trigger sync
      const syncManager = SyncManager.getInstance();
      setSyncing(true);
      syncManager.syncNow().finally(() => setSyncing(false));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    const syncManager = SyncManager.getInstance();
    await syncManager.syncNow();
    setSyncing(false);
  };

  if (!showBanner && isOnline) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        showBanner ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div
        className={`px-4 py-3 text-white text-sm font-medium flex items-center justify-between ${
          isOnline ? 'bg-brand-green-600' : 'bg-brand-orange-600'
        }`}
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi size={18} />
              <span>Back online</span>
              {syncing && (
                <span className="text-xs opacity-90">• Syncing...</span>
              )}
            </>
          ) : (
            <>
              <WifiOff size={18} />
              <span>You're offline</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isOnline && !syncing && (
            <button
              onClick={handleManualSync}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Sync now"
            >
              <RefreshCw size={16} />
            </button>
          )}
          {syncing && <RefreshCw size={16} className="animate-spin" />}
          <button
            onClick={() => setShowBanner(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
