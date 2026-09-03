import type { ReactNode } from 'react';
import HeroPicture from '@/components/marketing/HeroPicture';

export default function ComplianceCenterLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HeroPicture
        src="/images/pages/admin-campaigns-hero.webp"
        alt="Compliance operations and administrative review"
        microLabel="Compliance Center"
        analyticsName="compliance-center"
        priority={false}
      />
      {children}
    </>
  );
}
