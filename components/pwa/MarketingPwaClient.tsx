'use client';

import { MarketingPwaRegistration } from './MarketingPwaRegistration';
import { PwaInstallBanner } from './PwaInstallBanner';

export function MarketingPwaClient() {
  return (
    <>
      <MarketingPwaRegistration />
      <PwaInstallBanner />
    </>
  );
}
