'use client';

/**
 * Client-only global feature components.
 *
 * next/dynamic with ssr:false is only valid inside Client Components.
 * This wrapper is imported by app/layout.tsx (a Server Component) so
 * the dynamic imports stay in a client boundary.
 */

import dynamic from 'next/dynamic';

const GlobalAvatar = dynamic(() => import('@/components/GlobalAvatar'), { ssr: false });
const FacebookPixel = dynamic(() => import('@/components/FacebookPixel'), { ssr: false });
const AIAssistantBubble = dynamic(
  () => import('@/components/AIAssistantBubble').then((m) => ({ default: m.AIAssistantBubble })),
  { ssr: false },
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
