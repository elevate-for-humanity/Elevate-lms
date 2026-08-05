'use client';

import dynamic from 'next/dynamic';
import { MarketingPwaRegistration } from './MarketingPwaRegistration';

const PwaInstallBanner = dynamic(
  () => import('./PwaInstallBanner').then((m) => m.PwaInstallBanner || m),
  { ssr: false },
);

export function MarketingPwaClient() {
  return (
    <>
      <MarketingPwaRegistration />
      <PwaInstallBanner />
    </>
  );
}
