"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [locale, setLocale] = useState('en');

  const switchLanguage = (newLocale: string) => {
    setLocale(newLocale);
    // Update URL with locale
    const newPath = pathname.startsWith(`/${locale}`)
      ? pathname.replace(`/${locale}`, `/${newLocale}`)
      : `/${newLocale}${pathname}`;
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => switchLanguage('en')}
        className={`px-3 py-2 rounded text-sm font-medium transition ${
          locale === 'en'
            ? 'bg-brand-blue-600 text-white'
            : 'bg-gray-200 text-black hover:bg-gray-300'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button
        onClick={() => switchLanguage('es')}
        className={`px-3 py-2 rounded text-sm font-medium transition ${
          locale === 'es'
            ? 'bg-brand-blue-600 text-white'
            : 'bg-gray-200 text-black hover:bg-gray-300'
        }`}
        aria-label="Cambiar a Español"
      >
        ES
      </button>
    </div>
  );
}
