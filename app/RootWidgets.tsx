'use client';

import dynamicImport from 'next/dynamic';

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

const ServiceWorkerRegistration = dynamicImport(
  () => import('@/components/pwa/ServiceWorkerRegistration').then((m) => ({ default: m.ServiceWorkerRegistration })),
  { ssr: false, loading: () => null }
);

export default function RootWidgets() {
  return (
    <>
      <GlobalAvatar />
      <FacebookPixel />
      <ConditionalAIBubble />
      <ServiceWorkerRegistration />
    </>
  );
}
