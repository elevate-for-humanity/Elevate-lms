import type { ReactNode } from 'react';
import HeroPicture from '@/components/marketing/HeroPicture';

export default function PartnersLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HeroPicture
        src="/images/pages/about-hero.webp"
        alt="Community and workforce partnership collaboration"
        microLabel="Partners"
        analyticsName="partners"
        priority={false}
      />
      {children}
    </>
  );
}
