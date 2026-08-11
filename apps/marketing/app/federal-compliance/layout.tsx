import type { ReactNode } from 'react';
import HeroPicture from '@/components/marketing/HeroPicture';

export default function FederalComplianceLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HeroPicture
        src="/images/pages/workforce-training.webp"
        alt="Workforce training documentation and compliance operations"
        microLabel="Federal Compliance"
        analyticsName="federal-compliance"
        priority={false}
      />
      {children}
    </>
  );
}
