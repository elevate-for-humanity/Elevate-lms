'use client';

/**
 * Canonical PWA install banner.
 *
 * Shows once until dismissed (localStorage).
 * Auto-hides when already installed.
 * Only shows on desktop/Android where beforeinstallprompt fires.
 */
import { usePwaInstall } from '@/hooks/usePwaInstall';

interface PwaInstallBannerProps {
  /** Message shown to the user */
  message?: string;
  /** Dismissed state stored in localStorage key */
  storageKey?: string;
}

export function PwaInstallBanner({
  message = 'Install Elevate for faster access \u2014 add to your home screen.',
  storageKey = 'pwa-install-banner-dismissed',
}: PwaInstallBannerProps) {
  const { canInstall, isInstalled, promptInstall, dismiss } = usePwaInstall();

  if (!canInstall || isInstalled) return null;
  if (typeof window !== 'undefined' && localStorage.getItem(storageKey)) return null;

  return (
    <div
      role="complementary"
      aria-label="Install app"
      className="fixed bottom-0 inset-x-0 z-50 flex items-center justify-between gap-4 bg-brand-orange-600 text-white px-4 py-3 shadow-lg"
      style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.15)' }}
    >
      <p className="text-sm font-medium flex-1">{message}</p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={async () => {
            await promptInstall();
            dismiss();
          }}
          className="px-4 py-1.5 bg-white text-brand-orange-600 rounded-full text-sm font-semibold hover:bg-orange-50 transition-colors"
        >
          Install
        </button>
        <button
          onClick={() => {
            dismiss();
            if (typeof window !== 'undefined') {
              localStorage.setItem(storageKey, '1');
            }
          }}
          aria-label="Dismiss install prompt"
          className="p-1 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
