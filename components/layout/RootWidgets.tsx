'use client';

import dynamicImport from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import SpeechCanceller from '@/components/ui/SpeechCanceller';

// Loading placeholder to prevent null component errors
const LoadingDiv = () => <div className="hidden" />;

const GlobalAvatar = dynamicImport(
  () => import('@/components/GlobalAvatar').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);

const FacebookPixel = dynamicImport(
  () => import('@/components/FacebookPixel').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);

const ConditionalAIBubble = dynamicImport(
  () => import('@/components/ConditionalAIBubble').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);

// Deferred - cookie banner shows after 1s delay anyway, no reason to block
// the critical bundle. Moved here from app/layout.tsx synchronous import.
const CookieConsent = dynamicImport(
  () => import('@/components/CookieConsent').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);

const StickyMobileCTA = dynamicImport(
  () => import('@/components/ui/StickyMobileCTA').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);

export default function RootWidgets() {
  const pathname = usePathname();
  const isStoreRoute = pathname?.startsWith('/store') ?? false;

  // Mount non-critical widgets only after the browser is idle.
  // This keeps the main thread free during first paint and hydration.
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => setIdle(true), { timeout: 4000 });
    } else {
      const t = setTimeout(() => setIdle(true), 3000);
      return () => clearTimeout(t);
    }
  }, []);

  if (!idle) return null;

  return (
    <>
      <SpeechCanceller />
      {!isStoreRoute && <GlobalAvatar />}
      <FacebookPixel />
      {!isStoreRoute && <ConditionalAIBubble />}
      <CookieConsent />
      {!isStoreRoute && <StickyMobileCTA />}
    </>
  );
}
