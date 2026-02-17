"use client";

import React from 'react';

import { useOffline } from '@/hooks/use-offline';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const { isOnline, pendingActionsCount, syncOfflineActions } = useOffline();
  const [showIndicator, setShowIndicator] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Show indicator when offline or when there are pending actions
    setShowIndicator(!isOnline || pendingActionsCount > 0);
  }, [isOnline, pendingActionsCount]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncOfflineActions();
    } catch (error) { /* Error handled silently */ 
      // Error: $1
    } finally {
      setSyncing(false);
    }
  };

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-lg shadow-lg p-4 max-w-sm ${
        isOnline ? 'bg-brand-blue-600' : 'bg-brand-orange-600'
      } text-white`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {isOnline ? (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.415m-1.414-1.415L3 3"
              />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold">
            {isOnline ? 'Back Online' : 'Offline Mode'}
          </p>
          {pendingActionsCount > 0 && (
            <p className="text-sm opacity-90">
              {pendingActionsCount} action{pendingActionsCount !== 1 ? 's' : ''}{' '}
              pending
            </p>
          )}
        </div>
        {isOnline && pendingActionsCount > 0 && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex-shrink-0 px-3 py-2 bg-white text-brand-blue-600 rounded font-medium text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>
    </div>
  );
}
