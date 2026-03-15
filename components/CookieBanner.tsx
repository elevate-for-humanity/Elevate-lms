"use client";

import React from 'react';
// components/CookieBanner.tsx

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const accepted = window.localStorage.getItem('cookie-consent');
    if (!accepted) {
      // Show banner after a short delay for better UX
      setTimeout(() => setVisible(true), 1000);
    }
  }, []);

  const acceptCookies = () => {
    window.localStorage.setItem('cookie-consent', 'accepted');
    window.localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setVisible(false);
  };

  const declineCookies = () => {
    window.localStorage.setItem('cookie-consent', 'declined');
    window.localStorage.setItem('cookie-consent-date', new Date().toISOString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur-sm text-white shadow-2xl border-t border-slate-700">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <svg
              className="w-8 h-8 text-brand-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 text-sm">
            <p className="mb-2">
              <strong className="font-semibold">We use cookies</strong>
            </p>
            <p className="text-slate-600">
              We use cookies to operate the Elevate for Humanity platform, secure
              your session, and improve your experience. Essential cookies are
              required for the platform to function. By clicking "Accept All", you
              consent to our use of cookies.{' '}
              <Link
                href="/cookies"
                className="underline hover:text-white transition"
              >
                Learn more
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={declineCookies}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:border-slate-500 transition"
            >
              Essential Only
            </button>
            <button
              onClick={acceptCookies}
              className="px-4 py-2 text-sm font-semibold bg-brand-blue-600 hover:bg-brand-blue-700 rounded-lg transition shadow-lg"
            >
              Accept All
            </button>
          </div>
        </div>

        {/* Additional Links */}
        <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-4 text-xs text-slate-400">
          <Link href="/privacy-policy" aria-label="Link" className="hover:text-white transition">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" aria-label="Link" className="hover:text-white transition">
            Terms of Service
          </Link>
          <Link href="/cookies" aria-label="Link" className="hover:text-white transition">
            Cookie Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
