'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ResetBrowserPage() {
  const [status, setStatus] = useState('Resetting browser...');

  useEffect(() => {
    void hardResetBrowser();
  }, []);

  async function hardResetBrowser() {
    try {
      setStatus('Signing out from Supabase...');
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Continue clearing local browser state even if remote sign-out fails.
    }

    try {
      setStatus('Clearing localStorage...');
      localStorage.clear();
    } catch {
      // Storage can be blocked by browser/privacy policy; continue best-effort reset.
    }

    try {
      setStatus('Clearing sessionStorage...');
      sessionStorage.clear();
    } catch {
      // Storage can be blocked by browser/privacy policy; continue best-effort reset.
    }

    try {
      setStatus('Clearing Cache Storage...');
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {
      // Cache Storage is not guaranteed to be available in every browser context.
    }

    try {
      setStatus('Clearing IndexedDB...');
      const idb = window.indexedDB as IDBFactory & {
        databases?: () => Promise<Array<{ name?: string; version?: number }>>;
      };
      if (typeof idb?.databases === 'function') {
        const databases = await idb.databases();
        await Promise.all(
          databases.map((database) => database.name
            ? new Promise<void>((resolve) => {
                const request = indexedDB.deleteDatabase(database.name!);
                request.onsuccess = () => resolve();
                request.onerror = () => resolve();
                request.onblocked = () => resolve();
              })
            : Promise.resolve()),
        );
      }
    } catch {
      // IndexedDB enumeration/deletion support varies; continue clearing other state.
    }

    try {
      setStatus('Unregistering service workers...');
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
    } catch {
      // Service-worker access may be unavailable; continue the reset.
    }

    try {
      setStatus('Clearing cookies...');
      document.cookie.split(';').forEach((cookie) => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.slice(0, eqPos) : cookie;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
    } catch {
      // HttpOnly or policy-controlled cookies cannot be cleared from JavaScript.
    }

    setStatus('Complete! Reloading...');
    setTimeout(() => {
      location.replace('/support/reset-browser/done?ts=' + Date.now());
    }, 1000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Support' }, { label: 'Reset Browser' }]} />
      </div>
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-black mb-2">Resetting Browser</h1>
        <p className="text-black">{status}</p>
      </div>
    </div>
  );
}
