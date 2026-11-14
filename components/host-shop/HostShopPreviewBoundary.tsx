'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { HOST_SHOP_PREVIEW_MARKER } from '@/lib/partners/host-shop-preview-marker';

export default function HostShopPreviewBoundary({ marker, children }: { marker: string; children: ReactNode }) {
  const [stale, setStale] = useState(false);
  useEffect(() => {
    const expected = `${HOST_SHOP_PREVIEW_MARKER}=${marker}`;
    function changed() {
      return !document.cookie.split(';').some((entry) => entry.trim() === expected);
    }
    function check() { setStale(changed()); }
    function blockOldView(event: Event) {
      if (!changed()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setStale(true);
    }
    check();
    window.addEventListener('focus', check);
    window.addEventListener('pageshow', check);
    document.addEventListener('visibilitychange', check);
    const controls = ['click', 'auxclick', 'submit', 'keydown'];
    if (!stale) for (const type of controls) window.addEventListener(type, blockOldView, true);
    return () => {
      window.removeEventListener('focus', check);
      window.removeEventListener('pageshow', check);
      document.removeEventListener('visibilitychange', check);
      for (const type of controls) window.removeEventListener(type, blockOldView, true);
    };
  }, [marker, stale]);
  if (stale) return <main className="mx-auto max-w-xl p-6">
    <h1 className="text-2xl font-black">Your Host Shop selection changed</h1>
    <p className="my-4">This tab belongs to an earlier admin preview. Choose the shop you want to review before opening its records.</p>
    <a href="https://admin.elevateforhumanity.org/partners" className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 font-bold text-white">Choose a Host Shop</a>
  </main>;
  return children;
}
