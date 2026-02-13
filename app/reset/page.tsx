export const dynamic = 'force-dynamic';

'use client';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ResetPage() {
  const [status, setStatus] = useState('Resetting browser...');

  useEffect(() => {
    hardResetBrowser();
  }, []);

  async function hardResetBrowser() {
    try {
      setStatus('Signing out from Supabase...');
      const supabase = createClient();
      await supabase?.auth.signOut();
    } catch (error) { /* Error handled silently */ }

    try {
      setStatus('Clearing localStorage...');
      localStorage.clear();
    } catch (error) { /* Error handled silently */ }

    try {
      setStatus('Clearing sessionStorage...');
      sessionStorage.clear();
    } catch (error) { /* Error handled silently */ }

    try {
      setStatus('Clearing Cache Storage...');
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (error) { /* Error handled silently */ }

    try {
      setStatus('Clearing IndexedDB...');
      const idb = window.indexedDB as IDBFactory & { databases?: () => Promise<Array<{ name: string; version: number }>> };
      if (idb && typeof idb.databases === 'function') {
        const dbs = await idb.databases();
        await Promise.all(
          (dbs || []).map((db) =>
            db?.name
              ? new Promise<void>((resolve) => {
                  const req = indexedDB.deleteDatabase(db.name);
                  req.onsuccess = () => resolve();
                  req.onerror = () => resolve();
                  req.onblocked = () => resolve();
                })
              : Promise.resolve()
          )
        );
      }
    } catch (error) { /* Error handled silently */ }

    try {
      setStatus('Unregistering service workers...');
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (error) { /* Error handled silently */ }

    try {
      setStatus('Clearing cookies...');
      document.cookie.split(';').forEach((c) => {
        const eqPos = c.indexOf('=');
        const name = eqPos > -1 ? c.slice(0, eqPos) : c;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
    } catch (error) { /* Error handled silently */ }

    setStatus('Complete! Reloading...');
    setTimeout(() => {
      location.replace('/reset/done?ts=' + Date.now());
    }, 1000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: "Reset" }]} />
      </div>
<div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-black mb-2">
          Resetting Browser
        </h1>
        <p className="text-black">{status}</p>
      </div>
    </div>
  );
}
