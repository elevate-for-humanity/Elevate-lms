'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

interface UpdatePromptProps {
  onUpdate?: () => void;
}

export function UpdatePrompt({ onUpdate }: UpdatePromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Listen for service worker updates
    const handleUpdate = () => {
      setShowPrompt(true);
    };

    // Check for updates on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      }
    };

    // Listen for controlling service worker change
    navigator.serviceWorker.addEventListener('controllerchange', handleUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check for waiting service worker
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        setShowPrompt(true);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setShowPrompt(true);
            }
          });
        }
      });
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleUpdateClick = async () => {
    setUpdating(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        // Tell the waiting service worker to activate
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      onUpdate?.();
      
      // Reload after a short delay to allow SW to activate
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Update failed:', error);
      setUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-white text-white px-4 py-3 z-50 safe-area-inset-top">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <RefreshCw className={`w-5 h-5 ${updating ? 'animate-spin' : ''}`} />
          <p className="text-sm font-medium">
            A new version is available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleUpdateClick}
            disabled={updating}
            className="px-3 py-1 bg-white text-brand-blue-600 rounded-lg text-sm font-medium hover:bg-brand-blue-50 disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Update'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-brand-blue-500 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for checking app version
export function useAppVersion() {
  const [version, setVersion] = useState<string | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    // Get current version from meta tag or config
    const versionMeta = document.querySelector('meta[name="app-version"]');
    if (versionMeta) {
      setVersion(versionMeta.getAttribute('content'));
    }

    // Check for updates periodically
    const checkForUpdates = async () => {
      try {
        const response = await fetch('/api/version');
        if (response.ok) {
          const data = await response.json();
          if (version && data.version !== version) {
            setHasUpdate(true);
          }
        }
      } catch (error) {
        // Ignore errors
      }
    };

    const interval = setInterval(checkForUpdates, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [version]);

  return { version, hasUpdate };
}
