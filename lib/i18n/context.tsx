'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import en from './messages/en.json';
import es from './messages/es.json';
import fr from './messages/fr.json';

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

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function createLocaleStore() {
  let locale: Locale = 'en';
  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => locale,
    // Every streamed consumer hydrates against the same English snapshot as
    // its server HTML, even if another consumer already restored the cookie.
    getServerSnapshot: (): Locale => 'en',
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    restore: (next: Locale) => {
      if (locale === next) return;
      locale = next;
      listeners.forEach((listener) => listener());
    },
  };
}

const I18nContext = createContext<ReturnType<typeof createLocaleStore> | null>(null);

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

function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createLocaleStore);

  useEffect(() => {
    let savedLocale: Locale = 'en';
    try {
      const saved = document.cookie
        .split('; ')
        .find((c) => c.startsWith('NEXT_LOCALE='))
        ?.split('=')[1] as Locale | undefined;

      if (saved && LOCALES.includes(saved)) savedLocale = saved;
    } catch {
      // Ignore cookie errors.
    }
    store.restore(savedLocale);
  }, [store]);

  return <I18nContext.Provider value={store}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const store = useContext(I18nContext);
  if (!store) throw new Error('useI18n must be used within I18nProvider');
  const locale = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);

  const setLocale = useCallback((newLocale: Locale) => {
    if (!LOCALES.includes(newLocale)) return;
    try { document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`; }
    catch { /* The current view still works when preference storage is unavailable. */ }
    store.restore(newLocale);
  }, [store]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getValue(MESSAGES[locale], key);
      return interpolate(value, params);
    },
    [locale],
  );

  return {
    locale,
    setLocale,
    t,
  };
}
