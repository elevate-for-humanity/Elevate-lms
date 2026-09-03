'use client';

import { useState, useEffect, useCallback } from 'react';
import { getServiceWorkerManager, syncOfflineActions } from '@/lib/offline/service-worker-manager';
import { OfflineDB } from '@/lib/offline/offline-db';

export interface UseOfflineReturn {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  pendingActionsCount: number;
  syncOfflineActions: () => Promise<void>;
  addOfflineAction: (action: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string;
  }) => Promise<void>;
  clearOfflineActions: () => Promise<void>;
}

/**
 * Hook for managing offline functionality
 */
export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [db] = useState(() => new OfflineDB());

  // Initialize database
  useEffect(() => {
    db.init().catch(console.error);
  }, [db]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      syncOfflineActions().catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor service worker status
  useEffect(() => {
    const manager = getServiceWorkerManager();
    const checkReady = () => {
      setIsServiceWorkerReady(manager.isReady());
    };

    checkReady();
    const interval = setInterval(checkReady, 1000);

    return () => clearInterval(interval);
  }, []);

  // Monitor pending actions count
  useEffect(() => {
    const updateCount = async () => {
      try {
        const actions = await db.getAllOfflineActions();
        setPendingActionsCount(actions.length);
      } catch (error) {
        /* Error handled silently */
      }
    };

    updateCount();
    const interval = setInterval(updateCount, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [db]);

  // Listen for sync completion
  useEffect(() => {
    const handleSyncComplete = () => {
      // Refresh pending actions count
      db.getAllOfflineActions()
        .then((actions) => setPendingActionsCount(actions.length))
        .catch(console.error);
    };

    window.addEventListener('sw-sync-complete', handleSyncComplete);

    return () => {
      window.removeEventListener('sw-sync-complete', handleSyncComplete);
    };
  }, [db]);

  const handleSyncOfflineActions = useCallback(async () => {
    await syncOfflineActions();
  }, []);

  const addOfflineAction = useCallback(
    async (action: {
      url: string;
      method: string;
      headers: Record<string, string>;
      body: string;
    }) => {
      await db.addOfflineAction({
        ...action,
        timestamp: Date.now(),
        retryCount: 0,
      });
      setPendingActionsCount((count) => count + 1);
    },
    [db],
  );

  const clearOfflineActions = useCallback(async () => {
    const actions = await db.getAllOfflineActions();
    for (const action of actions) {
      if (action.id) {
        await db.removeOfflineAction(action.id);
      }
    }
    setPendingActionsCount(0);
  }, [db]);

  return {
    isOnline,
    isServiceWorkerReady,
    pendingActionsCount,
    syncOfflineActions: handleSyncOfflineActions,
    addOfflineAction,
    clearOfflineActions,
  };
}

/**
 * Hook for caching data offline
 */
export function useOfflineCache<T>(key: string, expiresIn?: number) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [db] = useState(() => new OfflineDB());

  useEffect(() => {
    db.init().catch(console.error);
  }, [db]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cachedData = await db.getCachedData(key);
        setData(cachedData);
      } catch (error) {
        /* Error handled silently */
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [db, key]);

  const saveData = useCallback(
    async (newData: T) => {
      await db.setCachedData(key, newData, expiresIn);
      setData(newData);
    },
    [db, key, expiresIn],
  );

  const clearData = useCallback(async () => {
    await db.deleteCachedData(key);
    setData(null);
  }, [db, key]);

  return {
    data,
    loading,
    saveData,
    clearData,
  };
}
