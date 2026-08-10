'use client';

import dynamic from 'next/dynamic';
import { MarketingPwaRegistration } from './MarketingPwaRegistration';

const PwaInstallBanner = dynamic(
  () => import('./PwaInstallBanner').then((module) => module.PwaInstallBanner),
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
