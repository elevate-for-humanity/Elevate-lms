"use client";

import React from 'react';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Check cookie first (more reliable than localStorage)
    const getCookie = (name: string) => {
      if (typeof document === 'undefined') return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const cookieConsent = getCookie('cookie-consent');
    const localConsent = localStorage.getItem('cookie-consent');
    
    if (!cookieConsent && !localConsent) {
      // Delay showing banner slightly for better UX
      setTimeout(() => {
        setShowBanner(true);
        setTimeout(() => setIsVisible(true), 100);
      }, 1000);
    }
  }, [mounted]);

  const handleAccept = () => {
    // Set cookie (365 days expiry)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.cookie = `cookie-consent=accepted; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    
    localStorage.setItem('cookie-consent', 'accepted');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);

    // Enable analytics if they were waiting for consent
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  };

  const handleReject = () => {
    // Set cookie (365 days expiry)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.cookie = `cookie-consent=rejected; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    
    localStorage.setItem('cookie-consent', 'rejected');
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);

    // Disable analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  };

  const handleClose = () => {
    // Closing the banner = implicit accept (analytics stay granted by default)
    handleAccept();
  };

  const bannerRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Focus trap: keep Tab within the banner while visible
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!bannerRef.current) return;
    if (e.key === 'Escape') {
      handleClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = bannerRef.current.querySelectorAll<HTMLElement>(
      'button, a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      // Auto-focus the first button when banner appears
      setTimeout(() => firstFocusRef.current?.focus(), 200);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, handleKeyDown]);

  // Don't render anything until mounted (prevents SSR/hydration issues)
  if (!mounted || !showBanner) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      aria-live="polite"
      className={`fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-white border-t-2 border-gray-200 shadow-2xl">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Content */}
            <div className="flex-1 pr-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <svg
                    className="w-6 h-6 text-brand-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 id="cookie-consent-title" className="font-semibold text-gray-900 mb-1">
                    We Value Your Privacy
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    We use cookies to enhance your experience, analyze site
                    traffic, and provide personalized content. By clicking
                    &ldquo;Accept&rdquo;, you consent to our use of cookies.{' '}
                    <a
                      href="/privacy-policy"
                      className="text-brand-blue-600 hover:text-brand-blue-700 underline"
                    >
                      Learn more
                    </a>
                  </p>
                </div>
              </div>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                ref={firstFocusRef}
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2"
                aria-label="Reject all cookies"
              >
                Reject
              </button>
              <button
                onClick={handleAccept}
                className="px-5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2"
                aria-label="Accept all cookies"
              >
                Accept
              </button>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2 rounded"
                aria-label="Close cookie consent banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to check if user has consented
export function hasUserConsented(): boolean | null {
  if (typeof window === 'undefined') return null;
  const consent = localStorage.getItem('cookie-consent');
  if (!consent) return null;
  return consent === 'accepted';
}

// Helper function to check if analytics should be enabled
export function shouldEnableAnalytics(): boolean {
  const consent = hasUserConsented();
  return consent === true;
}
