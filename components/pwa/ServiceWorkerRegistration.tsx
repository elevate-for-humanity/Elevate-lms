'use client';

import { useEffect } from 'react';

interface ServiceWorkerRegistrationProps {
  onUpdate?: () => void;
  onSuccess?: () => void;
}

export function ServiceWorkerRegistration({ 
  onUpdate, 
  onSuccess 
}: ServiceWorkerRegistrationProps) {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              // console.log('[PWA] New content available');
              onUpdate?.();
            } else if (newWorker.state === 'installed') {
              // Content cached for offline
              // console.log('[PWA] Content cached for offline use');
              onSuccess?.();
            }
          });
        });

        // Handle controller change (new SW activated)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        // console.log('[PWA] Service Worker registered');
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    // Register after page load
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, [onUpdate, onSuccess]);

  return null;
}

// Hook for service worker communication
export function useServiceWorker() {
  const postMessage = (message: { type: string; payload?: any }) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  };

  const cacheCourse = (urls: string[]) => {
    postMessage({ type: 'CACHE_COURSE', payload: { urls } });
  };

  const clearCourseCache = () => {
    postMessage({ type: 'CLEAR_COURSE_CACHE' });
  };

  const requestSync = (tag: string) => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        (registration as any).sync.register(tag);
      });
    }
  };

  return { postMessage, cacheCourse, clearCourseCache, requestSync };
}
