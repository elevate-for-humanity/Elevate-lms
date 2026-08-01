'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from './messages/en.json';
import es from './messages/es.json';
import fr from './messages/fr.json';

// Types
export const LOCALES = ['en', 'es', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
};

type Messages = typeof en;
const MESSAGES: Record<Locale, Messages> = { en, es, fr };

// Context type
interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Helper to get nested value
function getValue(obj: unknown, path: string): string {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }

  return typeof current === 'string' ? current : path;
}

// Helper to interpolate params
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? "{" + key + "}");
}

// Provider
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved locale on mount
  useEffect(() => {
    try {
      const saved = document.cookie
        .split('; ')
        .find((c) => c.startsWith('NEXT_LOCALE='))
        ?.split('=')[1] as Locale | undefined;

      if (saved && LOCALES.includes(saved)) {
        setLocaleState(saved);
      }
    } catch {
      // Ignore cookie errors
    }
    setIsHydrated(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    if (!LOCALES.includes(newLocale)) return;

    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    setLocaleState(newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const messages = MESSAGES[locale];
      const value = getValue(messages, key);
      return interpolate(value, params);
    },
    [locale],
  );

  // Use default locale during SSR to prevent hydration mismatch
  const contextValue: I18nContextValue = {
    locale: isHydrated ? locale : 'en',
    setLocale,
    t: isHydrated ? t : (key) => getValue(MESSAGES.en, key),
  };

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

// Hook
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
