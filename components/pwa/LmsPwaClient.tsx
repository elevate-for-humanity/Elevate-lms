'use client';

import dynamic from 'next/dynamic';
import { LmsPwaRegistration } from './LmsPwaRegistration';

const PwaInstallBanner = dynamic(
  () => import('./PwaInstallBanner').then((m) => m.PwaInstallBanner),
  { ssr: false },
);

export function LmsPwaClient() {
  return (
    <>
      <LmsPwaRegistration />
      <PwaInstallBanner />
    </>
  );
}
