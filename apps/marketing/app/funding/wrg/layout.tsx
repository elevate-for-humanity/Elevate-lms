import type { ReactNode } from 'react';
import HeroPicture from '@/components/marketing/HeroPicture';

export default function WrgFundingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HeroPicture
        src="/images/heroes/hero-federal-funding.webp"
        alt="Workforce funding resources and training support"
        microLabel="WRG Funding"
        analyticsName="wrg-funding"
        priority={false}
      />
      {children}
    </>
  );
}
