'use client';

import { useEffect, useState } from 'react';
import { Smartphone, X } from 'lucide-react';

/**
 * Explains how to install the Admin PWA (no App Store app — add to home screen).
 */
export default function DevStudioPwaHint() {
  const [standalone, setStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setStandalone(window.matchMedia('(display-mode: standalone)').matches);
    setDismissed(sessionStorage.getItem('dev-studio-pwa-hint-dismissed') === '1');
  }, []);

  if (standalone || dismissed) return null;

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <div className="shrink-0 border-b border-brand-blue-200 bg-brand-blue-50 px-3 py-2.5">
      <div className="mx-auto flex max-w-3xl gap-2">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue-600" />
        <div className="min-w-0 flex-1 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">Install the Admin app (no App Store needed)</p>
          <p className="mt-0.5 leading-relaxed">
            {isIos ? (
              <>
                Safari → Share → <strong>Add to Home Screen</strong>. Opens like an app at{' '}
                <code className="rounded bg-white px-1"></code>.
              </>
            ) : (
              <>
                Use the <strong>Install Admin App</strong> banner when it appears, or Chrome menu →{' '}
                <strong>Install app</strong> / Add to Home screen.
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem('dev-studio-pwa-hint-dismissed', '1');
            setDismissed(true);
          }}
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white hover:text-slate-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
