'use client';

import { useEffect, useState } from 'react';

type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function AdminInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<DeferredPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Already installed as standalone — don't show
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as DeferredPromptEvent);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg lg:bottom-4 lg:left-auto lg:right-4 lg:w-80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Install Admin App</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Add to home screen for fast mobile access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleInstall}
          className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Install
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
