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

export default function ClientOnlyFeatures() {
  return (
    <>
      <GlobalAvatar />
      <FacebookPixel />
      <AIAssistantBubble />
    </>
  );
}
