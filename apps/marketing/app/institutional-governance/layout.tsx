import type { ReactNode } from 'react';
import HeroPicture from '@/components/marketing/HeroPicture';

export default function InstitutionalGovernanceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HeroPicture
        src="/images/hero/admin-hero.webp"
        alt="Administrative governance and institutional oversight"
        microLabel="Governance"
        analyticsName="institutional-governance"
        priority={false}
      />
      {children}
    </>
  );
}
