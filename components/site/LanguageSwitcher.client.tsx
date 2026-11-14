'use client';

import { useState, useEffect, useRef } from 'react';
import { locales, localeNames, localeFlags, type Locale, defaultLocale } from '@/i18n/config';

function getCurrentLocale(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const val = match?.[1] as Locale | undefined;
  return val && locales.includes(val) ? val : defaultLocale;
}

type LanguageSwitcherProps = {
  compact?: boolean;
};

export default function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Locale>(defaultLocale);
  const ref = useRef<HTMLDivElement>(null);

  // Read current locale from cookie on mount
  useEffect(() => {
    setCurrent(getCurrentLocale());
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  function switchLocale(locale: Locale) {
    // Persist for 1 year, apply site-wide
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setCurrent(locale);
    setOpen(false);
    // Force full page reload to pick up the new locale
    window.location.reload();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Language: ${localeNames[current]}. Change language.`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center text-slate-500 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100 ${
          compact ? 'gap-1 px-1.5 py-1 text-xs' : 'gap-1.5 px-2 py-1.5 text-sm'
        }`}
      >
        {/* Globe icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-xs font-semibold uppercase">{current}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[9999] py-1"
        >
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              role="option"
              aria-selected={locale === current}
              onClick={() => switchLocale(locale)}
              className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-slate-50 ${
                locale === current ? 'font-semibold text-brand-red-600 bg-red-50' : 'text-slate-700'
              }`}
            >
              <span className="text-base leading-none" aria-hidden="true">{localeFlags[locale]}</span>
              <span>{localeNames[locale]}</span>
              {locale === current && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5 ml-auto text-brand-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
