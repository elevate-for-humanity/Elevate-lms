'use client';

import { useState, useEffect } from 'react';
import { getDB } from '@/lib/offline/db';

export function useOfflineData<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  options: {
    cacheFirst?: boolean;
    maxAge?: number; // milliseconds
  } = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const db = await getDB();

        // Try cache first if requested
        if (options.cacheFirst || !navigator.onLine) {
          try {
            const cached = await db.getCourse(cacheKey);
            if (cached) {
              const age = Date.now() - cached.cachedAt;
              const maxAge = options.maxAge || 24 * 60 * 60 * 1000; // 24 hours default

              if (age < maxAge || !navigator.onLine) {
                if (mounted) {
                  setData(cached as unknown as T);
                  setFromCache(true);
                  setLoading(false);
                }

                // If online, fetch fresh data in background
                if (navigator.onLine && age > maxAge / 2) {
                  fetchFresh();
                }
                return;
              }
            }
          } catch (error) {
            /* Error handled silently */
          }
        }

        // Fetch fresh data
        await fetchFresh();
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    async function fetchFresh() {
      try {
        const freshData = await fetchFn();

        if (mounted) {
          setData(freshData);
          setFromCache(false);
          setLoading(false);
        }

        // Cache the fresh data
        try {
          const db = await getDB();
          await db.saveCourse({
            id: cacheKey,
            title: '',
            description: '',
            lessons: [],
            cachedAt: Date.now(),
            ...(freshData as any),
          });
        } catch (error) {
          /* Error handled silently */
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, options.cacheFirst, options.maxAge]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const freshData = await fetchFn();
      setData(freshData);
      setFromCache(false);

      // Update cache
      const db = await getDB();
      await db.saveCourse({
        id: cacheKey,
        title: '',
        description: '',
        lessons: [],
        cachedAt: Date.now(),
        ...(freshData as any),
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fromCache, refresh };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
