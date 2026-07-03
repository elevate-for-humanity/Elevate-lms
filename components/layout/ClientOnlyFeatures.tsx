'use client';

/**
 * Client-only global feature components.
 *
 * next/dynamic with ssr:false is only valid inside Client Components.
 * This wrapper is imported by app/layout.tsx (a Server Component) so
 * the dynamic imports stay in a client boundary.
 */

import dynamic from 'next/dynamic';

// Loading placeholder to prevent null component errors
const LoadingDiv = () => <div className="hidden" />;

const GlobalAvatar = dynamic(
  () => import('@/components/GlobalAvatar').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);
const FacebookPixel = dynamic(
  () => import('@/components/FacebookPixel').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);
const AIAssistantBubble = dynamic(
  () => import('@/components/AIAssistantBubble').then((m) => m.AIAssistantBubble || m.default || (() => null)),
  { ssr: false, loading: LoadingDiv }
);
const GoogleAnalytics = dynamic(
  () => import('@/components/analytics/google-analytics').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);
const GoogleAdsConversion = dynamic(
  () => import('@/components/analytics/google-ads').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);
const DMCATrackingPixel = dynamic(
  () => import('@/components/InvisibleWatermark').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);
const CopyrightProtection = dynamic(
  () => import('@/components/CopyrightProtection').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);
const InstallPromptBanner = dynamic(
  () => import('@/components/pwa/InstallPromptBanner').then((m) => m.default || m),
  { ssr: false, loading: LoadingDiv }
);

export default function ClientOnlyFeatures() {
  return (
    <>
      <GlobalAvatar />
      <FacebookPixel />
      <AIAssistantBubble />
      <GoogleAnalytics />
      <GoogleAdsConversion />
      <DMCATrackingPixel />
      <CopyrightProtection />
      <InstallPromptBanner />
    </>
  );
}
