'use client';

import { useState, useEffect, useCallback } from 'react';

interface OfflineCourseState {
  isAvailableOffline: boolean;
  isCaching: boolean;
  cacheProgress: number;
  error: string | null;
}

interface CourseAsset {
  url: string;
  type: 'video' | 'document' | 'image' | 'page';
}

/**
 * Hook for managing offline course availability
 * Allows users to download courses for offline access
 */
export function useOfflineCourse(courseId: string) {
  const [state, setState] = useState<OfflineCourseState>({
    isAvailableOffline: false,
    isCaching: false,
    cacheProgress: 0,
    error: null,
  });

  // Check if course is already cached
  useEffect(() => {
    checkOfflineStatus();
  }, [courseId]);

  const checkOfflineStatus = useCallback(async () => {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(`elevate-courses-v2`);
      const keys = await cache.keys();
      const courseUrls = keys.filter((req) => req.url.includes(`/courses/${courseId}`));

      setState((prev) => ({
        ...prev,
        isAvailableOffline: courseUrls.length > 0,
      }));
    } catch (error) {
      console.error('Failed to check offline status:', error);
    }
  }, [courseId]);

  const downloadForOffline = useCallback(
    async (assets: CourseAsset[]) => {
      if (!('serviceWorker' in navigator) || !('caches' in window)) {
        setState((prev) => ({
          ...prev,
          error: 'Offline mode is not supported in this browser',
        }));
        return false;
      }

      setState((prev) => ({
        ...prev,
        isCaching: true,
        cacheProgress: 0,
        error: null,
      }));

      try {
        const cache = await caches.open(`elevate-courses-v2`);
        const total = assets.length;
        let completed = 0;

        // Cache assets in batches to avoid overwhelming the browser
        const batchSize = 5;
        for (let i = 0; i < assets.length; i += batchSize) {
          const batch = assets.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async (asset) => {
              try {
                const response = await fetch(asset.url);
                if (response.ok) {
                  await cache.put(asset.url, response);
                }
              } catch {
                // Skip failed assets but continue
                console.warn(`Failed to cache: ${asset.url}`);
              }
              completed++;
              setState((prev) => ({
                ...prev,
                cacheProgress: Math.round((completed / total) * 100),
              }));
            }),
          );
        }

        // Also cache the course pages
        const coursePages = [`/courses/${courseId}`, `/courses/${courseId}/learn`];

        await Promise.all(
          coursePages.map(async (url) => {
            try {
              const response = await fetch(url);
              if (response.ok) {
                await cache.put(url, response);
              }
            } catch {
              // Skip failed pages
            }
          }),
        );

        setState((prev) => ({
          ...prev,
          isCaching: false,
          isAvailableOffline: true,
          cacheProgress: 100,
        }));

        // Notify service worker
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_COURSE',
            payload: { courseId, urls: assets.map((a) => a.url) },
          });
        }

        return true;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isCaching: false,
          error: 'Failed to download course for offline access',
        }));
        return false;
      }
    },
    [courseId],
  );

  const removeOfflineData = useCallback(async () => {
    if (!('caches' in window)) return false;

    try {
      const cache = await caches.open(`elevate-courses-v2`);
      const keys = await cache.keys();

      await Promise.all(
        keys
          .filter((req) => req.url.includes(`/courses/${courseId}`))
          .map((req) => cache.delete(req)),
      );

      setState((prev) => ({
        ...prev,
        isAvailableOffline: false,
      }));

      return true;
    } catch (error) {
      console.error('Failed to remove offline data:', error);
      return false;
    }
  }, [courseId]);

  return {
    ...state,
    downloadForOffline,
    removeOfflineData,
    checkOfflineStatus,
  };
}

/**
 * Hook to check overall offline status
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

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

/**
 * Component to show offline indicator
 */
export function OfflineIndicator() {
  const isOnline = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div
      className="fixed bottom-4 left-4 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
      role="alert"
      aria-live="polite"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
        />
      </svg>
      <span>{"You're offline"}</span>
    </div>
  );
}
