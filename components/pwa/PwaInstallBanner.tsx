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
import { usePathname } from 'next/navigation';
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
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const videos = document.querySelectorAll('main video');
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setVideoVisible(visible.size > 0);
    });
    setVideoVisible(false);
    videos.forEach(video => observer.observe(video));
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPageSettled(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    try { setBannerDismissed(Boolean(window.localStorage.getItem(storageKey))); }
    catch { setBannerDismissed(false); }
  }, [storageKey]);

  // Installation is optional; never cover an on-screen film or its controls.
  if (!pageSettled || isInstalled || bannerDismissed || videoVisible) return null;

  const isIos = platform === 'ios';
  if (!canInstall && !isIos) return null;

  const dismissBanner = () => {
    dismiss();
    setShowIosHelp(false);
    setBannerDismissed(true);
    try { window.localStorage.setItem(storageKey, '1'); } catch { /* Dismiss for this session when storage is unavailable. */ }
  };

  return (
    <div
      role="complementary"
      data-pwa-install-banner
      aria-label="Install Elevate app"
      className="fixed left-4 right-4 z-50 rounded-2xl border border-orange-300 bg-brand-orange-700 px-4 py-3 text-white shadow-2xl sm:left-auto sm:right-5 sm:max-w-md"
      style={{ bottom: 'calc(var(--elevate-pwa-bottom-offset, 1rem) + env(safe-area-inset-bottom, 0px))', boxShadow: '0 16px 40px rgba(15,23,42,0.24)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-48">
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
            className="min-h-11 px-4 py-1.5 bg-white text-brand-orange-700 rounded-full text-sm font-semibold hover:bg-orange-50 transition-colors"
          >
            {isIos ? 'How to Install' : 'Install'}
          </button>
          <button
            onClick={dismissBanner}
            aria-label="Dismiss install prompt"
            className="inline-flex min-h-11 min-w-11 items-center justify-center p-1 text-white hover:text-white transition-colors"
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
