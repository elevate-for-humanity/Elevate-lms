'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { updateConsent } from '@/components/analytics/google-analytics';

const CONSENT_COOKIE = 'cookie-consent';
const CONSENT_STORAGE = 'cookie-consent';

type ConsentChoice = 'accepted' | 'rejected';

function persistConsent(choice: ConsentChoice) {
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  document.cookie = `${CONSENT_COOKIE}=${choice}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  localStorage.setItem(CONSENT_STORAGE, choice);
  localStorage.setItem('cookie-consent-date', new Date().toISOString());
  window.dispatchEvent(new CustomEvent('efh:cookie-consent', { detail: { choice } }));
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift() ?? null;
      return null;
    };

    const saved = getCookie(CONSENT_COOKIE) || localStorage.getItem(CONSENT_STORAGE);
    if (saved === 'accepted') {
      updateConsent(true, true);
      return;
    }
    if (saved === 'rejected') {
      updateConsent(false, false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowBanner(true);
      window.setTimeout(() => setIsVisible(true), 50);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [mounted]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    window.setTimeout(() => setShowBanner(false), 250);
  }, []);

  const handleAccept = useCallback(() => {
    persistConsent('accepted');
    updateConsent(true, true);
    dismiss();
  }, [dismiss]);

  const handleReject = useCallback(() => {
    persistConsent('rejected');
    updateConsent(false, false);
    dismiss();
  }, [dismiss]);

  // Closing is not consent. Treat dismissing the banner as rejection so no
  // optional tracking is enabled without an affirmative choice.
  const handleClose = handleReject;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!bannerRef.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        handleReject();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = bannerRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [handleReject],
  );

  useEffect(() => {
    if (!isVisible) return;
    document.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => firstFocusRef.current?.focus(), 100);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isVisible, handleKeyDown]);

  if (!mounted || !showBanner) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className={`fixed inset-x-0 bottom-0 z-[9999] transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="border-t-2 border-slate-200 bg-white shadow-2xl">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <h2 id="cookie-consent-title" className="font-semibold text-slate-950">
                Cookie preferences
              </h2>
              <p
                id="cookie-consent-description"
                className="mt-1 text-sm leading-relaxed text-slate-700"
              >
                Necessary cookies keep the site working. Analytics and advertising cookies are
                optional and remain off unless you accept them.{' '}
                <Link
                  href="/legal/privacy"
                  className="font-medium text-brand-blue-700 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-brand-blue-500"
                >
                  Privacy policy
                </Link>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                ref={firstFocusRef}
                type="button"
                onClick={handleReject}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2"
              >
                Necessary only
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2"
              >
                Accept optional cookies
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2"
                aria-label="Close and use necessary cookies only"
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  ×
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function hasUserConsented(): boolean | null {
  if (typeof window === 'undefined') return null;
  const consent = localStorage.getItem(CONSENT_STORAGE);
  if (!consent) return null;
  return consent === 'accepted';
}

export function shouldEnableAnalytics(): boolean {
  return hasUserConsented() === true;
}
