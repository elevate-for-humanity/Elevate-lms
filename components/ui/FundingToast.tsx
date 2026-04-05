"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'efh_funding_toast_dismissed';

export default function FundingToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // small delay so it feels natural
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:px-0">
      <div className="flex max-w-md items-start gap-3 rounded-2xl bg-white/95 p-4 text-sm text-slate-50 shadow-xl ring-1 ring-slate-800">
        <div className="mt-0.5 hidden h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold sm:flex">
          $
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-orange-400">
            Funding alert
          </p>
          <p className="text-sm font-medium">
            Funding may be available if you qualify.
          </p>
          <p className="text-xs text-slate-200">
            Many programs may be supported by workforce partners, employers, or
            scholarships. Talk to a career coach to explore your options.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href="/contact?topic=funding"
              className="inline-flex items-center justify-center rounded-full bg-brand-orange-500 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-orange-400"
            >
              Check funding options
            </Link>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center justify-center rounded-full border border-slate-600 px-3 py-2.5 text-xs font-semibold text-slate-100 hover:bg-slate-800"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="-mt-1 ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          aria-label="Dismiss funding notice"
        >
          ×
        </button>
      </div>
    </div>
  );
}
