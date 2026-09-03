'use client';

/**
 * Canonical PWA install prompt hook.
 * Use one instance per app \u2014 consumes the browser's `beforeinstallprompt` event.
 *
 * Usage:
 * const { canInstall, isInstalled, promptInstall } = usePwaInstall();
 */
import { useState, useEffect, useCallback } from 'react';

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export interface UsePwaInstallReturn {
  /** True when beforeinstallprompt has fired and user has not yet responded */
  canInstall: boolean;
  /** True when app is running as installed PWA (standalone display mode) */
  isInstalled: boolean;
  /** True when display-mode is standalone */
  isStandalone: boolean;
  /** Trigger the native install dialog */
  promptInstall: () => Promise<boolean>;
  /** Dismiss the prompt \u2014 sets canInstall=false */
  dismiss: () => void;
  /** The raw BeforeInstallPromptEvent for custom UIs */
  promptEvent: BeforeInstallPromptEvent | null;
  /** Platform: 'ios' | 'android' | 'desktop' | 'unknown' */
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  /** Desktop browser if on desktop */
  desktopBrowser: 'chrome' | 'edge' | 'safari' | 'firefox' | 'other';
}

export function usePwaInstall(): UsePwaInstallReturn {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [desktopBrowser, setDesktopBrowser] = useState<
    'chrome' | 'edge' | 'safari' | 'firefox' | 'other'
  >('other');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect platform and browser
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    } else if (typeof navigator !== 'undefined') {
      setPlatform('desktop');
      if (/edg\/|edge/.test(ua)) setDesktopBrowser('edge');
      else if (/chrome\/|chromium/.test(ua)) setDesktopBrowser('chrome');
      else if (/firefox\//.test(ua)) setDesktopBrowser('firefox');
      else if (/safari\//.test(ua) && !/chromium/.test(ua)) setDesktopBrowser('safari');
      else setDesktopBrowser('other');
    }

    // Already installed
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true
    );

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setPromptEvent(null);
    };

    const onDisplayChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };

    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener('change', onDisplayChange);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      mq.removeEventListener('change', onDisplayChange);
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!promptEvent) return false;
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setPromptEvent(null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    setPromptEvent(null);
  }, []);

  return {
    canInstall: promptEvent !== null,
    isInstalled,
    isStandalone,
    promptInstall,
    dismiss,
    promptEvent,
    platform,
    desktopBrowser,
  };
}
