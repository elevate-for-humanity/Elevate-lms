'use client';

import { useEffect, useRef } from 'react';

export function SkipToContent() {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const focusSkipLinkOnFirstTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.shiftKey || document.activeElement !== document.body) return;
      event.preventDefault();
      linkRef.current?.focus();
    };
    window.addEventListener('keydown', focusSkipLinkOnFirstTab, true);
    return () => window.removeEventListener('keydown', focusSkipLinkOnFirstTab, true);
  }, []);

  return (
    <a
      ref={linkRef}
      href="#main-content"
      tabIndex={0}
      className="skip-to-main fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-md transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-brand-blue-600"
    >
      Skip to main content
    </a>
  );
}
