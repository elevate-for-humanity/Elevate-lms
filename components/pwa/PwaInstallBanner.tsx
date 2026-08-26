'use client';

/**
 * Canonical PWA install banner.
 *
 * - Android/Chromium: uses the native beforeinstallprompt flow.
 * - iOS/iPadOS: shows the Safari Add to Home Screen instructions because
 *   WebKit does not expose beforeinstallprompt.
 * - Auto-hides when already installed.
 */
import { useEffect, useState } from 'react';
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface PwaInstallBannerProps {
  /** Message shown to the user */
  message?: string;
  /** Dismissed state stored in localStorage key */
  storageKey?: string;
}

export function PwaInstallBanner({
  message = 'Install Elevate for faster access — add it to your home screen.',
  storageKey = 'pwa-install-banner-dismissed',
}: PwaInstallBannerProps) {
  const { canInstall, isInstalled, promptInstall, dismiss, platform } = usePwaInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [pageSettled, setPageSettled] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setPageSettled(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!pageSettled || isInstalled) return null;
  if (typeof window !== 'undefined' && localStorage.getItem(storageKey)) return null;

  const isIos = platform === 'ios';
  if (!canInstall && !isIos) return null;

  const dismissBanner = () => {
    dismiss();
    setShowIosHelp(false);
    if (typeof window !== 'undefined') localStorage.setItem(storageKey, '1');
  };

  return (
    <div
      role="complementary"
      aria-label="Install Elevate app"
      className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-orange-300 bg-brand-orange-700 px-4 py-3 text-white shadow-2xl sm:left-auto sm:right-5 sm:max-w-md"
      style={{ boxShadow: '0 16px 40px rgba(15,23,42,0.24)' }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{message}</p>
          {isIos && showIosHelp ? (
            <p className="mt-1 text-xs leading-5 text-white/90">
              In Safari, tap Share, then choose <strong>Add to Home Screen</strong>, then tap Add.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={async () => {
              if (isIos) {
                setShowIosHelp(true);
                return;
              }
              const accepted = await promptInstall();
              if (accepted) dismiss();
            }}
            className="px-4 py-1.5 bg-white text-brand-orange-600 rounded-full text-sm font-semibold hover:bg-orange-50 transition-colors"
          >
            {isIos ? 'How to Install' : 'Install'}
          </button>
          <button
            onClick={dismissBanner}
            aria-label="Dismiss install prompt"
            className="p-1 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
