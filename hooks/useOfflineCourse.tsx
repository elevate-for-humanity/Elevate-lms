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

const OFFLINE_METADATA_PREFIX = 'elevate-offline-course:';
const SAFE_OFFLINE_ASSET = /\.(?:pdf|png|jpe?g|webp|avif|gif|svg|mp3|m4a|ogg|wav|mp4|webm|vtt)(?:\?.*)?$/i;

function metadataKey(courseId: string) {
  return `${OFFLINE_METADATA_PREFIX}${courseId}`;
}

function getController(): ServiceWorker | null {
  return navigator.serviceWorker?.controller ?? null;
}

async function sendWorkerMessage<T>(message: unknown): Promise<T> {
  const controller = getController();
  if (!controller) throw new Error('Install or refresh the LMS while online before downloading offline resources.');

  return new Promise<T>((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => reject(new Error('Offline download timed out. Please try again.')), 30000);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout);
      const data = event.data;
      if (data?.ok) resolve(data as T);
      else reject(new Error(data?.error || 'Offline download failed.'));
    };
    controller.postMessage(message, [channel.port2]);
  });
}

/**
 * Downloads only explicit static course resources. Authenticated course HTML,
 * API responses, learner progress, identity data, and dashboard content are
 * intentionally never copied into Cache Storage.
 */
export function useOfflineCourse(courseId: string) {
  const [state, setState] = useState<OfflineCourseState>({
    isAvailableOffline: false,
    isCaching: false,
    cacheProgress: 0,
    error: null,
  });

  const checkOfflineStatus = useCallback(async () => {
    try {
      const raw = localStorage.getItem(metadataKey(courseId));
      const metadata = raw ? JSON.parse(raw) : null;
      setState((prev) => ({ ...prev, isAvailableOffline: Boolean(metadata?.cachedCount > 0) }));
    } catch {
      setState((prev) => ({ ...prev, isAvailableOffline: false }));
    }
  }, [courseId]);

  useEffect(() => {
    void checkOfflineStatus();
  }, [checkOfflineStatus]);

  const downloadForOffline = useCallback(async (assets: CourseAsset[]) => {
    if (!('serviceWorker' in navigator) || !navigator.onLine) {
      setState((prev) => ({ ...prev, error: 'Connect to the internet before downloading course resources.' }));
      return false;
    }

    // Page/HTML assets are excluded even when callers accidentally label them
    // as downloadable. The service worker performs the same allow-list check.
    const urls = Array.from(new Set(
      assets
        .map((asset) => asset.url)
        .filter((url) => SAFE_OFFLINE_ASSET.test(url))
        .filter((url) => {
          try {
            const parsed = new URL(url, window.location.origin);
            return parsed.origin === window.location.origin && !parsed.pathname.startsWith('/api/');
          } catch {
            return false;
          }
        }),
    ));

    if (!urls.length) {
      setState((prev) => ({ ...prev, error: 'This course has no approved static resources available for offline download.' }));
      return false;
    }

    setState((prev) => ({ ...prev, isCaching: true, cacheProgress: 10, error: null }));

    try {
      const result = await sendWorkerMessage<{ ok: true; cachedCount: number; requestedCount: number }>({
        type: 'CACHE_COURSE',
        payload: { courseId, urls },
      });

      if (!result.cachedCount) throw new Error('No course resources could be downloaded.');
      localStorage.setItem(metadataKey(courseId), JSON.stringify({
        cachedCount: result.cachedCount,
        requestedCount: result.requestedCount,
        cachedAt: new Date().toISOString(),
      }));
      setState({ isCaching: false, isAvailableOffline: true, cacheProgress: 100, error: null });
      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isCaching: false,
        cacheProgress: 0,
        error: error instanceof Error ? error.message : 'Failed to download course resources.',
      }));
      return false;
    }
  }, [courseId]);

  const removeOfflineData = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return false;
    try {
      await sendWorkerMessage<{ ok: true }>({ type: 'CLEAR_COURSE_CACHE' });
      // COURSE_CACHE is shared across explicit downloads, so clearing it makes
      // all locally recorded course-download metadata stale. Remove all markers.
      for (let index = localStorage.length - 1; index >= 0; index--) {
        const key = localStorage.key(index);
        if (key?.startsWith(OFFLINE_METADATA_PREFIX)) localStorage.removeItem(key);
      }
      setState((prev) => ({ ...prev, isAvailableOffline: false, cacheProgress: 0, error: null }));
      return true;
    } catch (error) {
      setState((prev) => ({ ...prev, error: error instanceof Error ? error.message : 'Failed to remove offline resources.' }));
      return false;
    }
  }, []);

  return { ...state, downloadForOffline, removeOfflineData, checkOfflineStatus };
}

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

export function OfflineIndicator() {
  const isOnline = useOfflineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50" role="alert" aria-live="polite">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
      </svg>
      <span>You&apos;re offline</span>
    </div>
  );
}
