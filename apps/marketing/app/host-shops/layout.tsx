import type { ReactNode } from 'react';
import HeroPicture from '@/components/marketing/HeroPicture';

export default function HostShopsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HeroPicture
        src="/images/pages/apprenticeship-structure.webp"
        alt="Registered apprenticeship host shop training structure"
        microLabel="Host Shops"
        analyticsName="host-shops"
        priority={false}
      />
      {children}
    </>
  );
}
