'use client';

import dynamicImport from 'next/dynamic';

const GlobalAvatar = dynamicImport(() => import('@/components/GlobalAvatar'), {
  ssr: false,
});

const FacebookPixel = dynamicImport(() => import('@/components/FacebookPixel'), {
  ssr: false,
});

const AIAssistantBubble = dynamicImport(
  () =>
    import('@/components/AIAssistantBubble').then((m) => ({
      default: m.AIAssistantBubble,
    })),
  { ssr: false }
);

export default function LayoutClientShell() {
  return (
    <>
      <GlobalAvatar />
      <FacebookPixel />
      <AIAssistantBubble />
    </>
  );
}
