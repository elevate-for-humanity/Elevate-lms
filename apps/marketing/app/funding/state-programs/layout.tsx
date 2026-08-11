import type { ReactNode } from 'react';
import HeroPicture from '@/components/marketing/HeroPicture';

export default function StateProgramsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HeroPicture
        src="/images/pages/admin-wioa-hero.webp"
        alt="Workforce funding and training planning"
        microLabel="State Funding"
        analyticsName="state-programs"
        priority={false}
      />
      {children}
    </>
  );
}
