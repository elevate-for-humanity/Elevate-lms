"use client";

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const NAV = [
  { label: 'Home', href: '/' },
  { label: 'Programs', href: '/programs' },
  { label: 'Store', href: '/store' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Apply', href: '/inquiry' },
  { label: 'Login', href: '/login' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const lastScrollY = useRef(0);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape (helps Android keyboards + accessibility)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Proper scroll lock: prevents iOS "page stuck" + restores exactly
  useEffect(() => {
    if (!open) {
      // restore
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, lastScrollY.current || 0);
      return;
    }

    // lock
    lastScrollY.current = window.scrollY || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lastScrollY.current}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      // safety cleanup (if component unmounts)
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, lastScrollY.current || 0);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-3 py-2 font-bold hover:bg-gray-50"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mount overlay ONLY when open (prevents ghost overlay touch lock) */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Drawer (scrollable) */}
          <div className="absolute right-0 top-0 h-[100dvh] w-80 max-w-[85vw] bg-white shadow-xl p-5 overflow-y-auto overscroll-contain">
            <div className="flex items-center justify-between mb-6">
              <div className="font-black text-lg">Elevate</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-gray-300 px-3 py-2 font-bold hover:bg-gray-50"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <nav role="navigation" aria-label="Main navigation" className="flex flex-col gap-2">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      'rounded-xl px-4 py-3 font-semibold transition',
                      active
                        ? 'bg-brand-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
