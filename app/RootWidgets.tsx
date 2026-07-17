'use client';

import dynamicImport from 'next/dynamic';
import { useEffect, useState } from 'react';

const GlobalAvatar = dynamicImport(() => import('@/components/GlobalAvatar'), {
  ssr: false,
  loading: () => null,
});

const FacebookPixel = dynamicImport(() => import('@/components/FacebookPixel'), {
  ssr: false,
  loading: () => null,
});

const ConditionalAIBubble = dynamicImport(() => import('@/components/ConditionalAIBubble'), {
  ssr: false,
  loading: () => null,
});

// Deferred — cookie banner shows after 1s delay anyway, no reason to block
// the critical bundle. Moved here from app/layout.tsx synchronous import.
const CookieConsent = dynamicImport(() => import('@/components/CookieConsent'), {
  ssr: false,
  loading: () => null,
});

export default function RootWidgets() {
  // Mount non-critical widgets only after the browser is idle.
  // This keeps the main thread free during first paint and hydration.
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => setIdle(true), { timeout: 4000 });
      return undefined;
    } else {
      const t = setTimeout(() => setIdle(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!idle) return null;

  return (
    <>
      <GlobalAvatar />
      <FacebookPixel />
      <ConditionalAIBubble />
      <CookieConsent />
    </>
  );
}
