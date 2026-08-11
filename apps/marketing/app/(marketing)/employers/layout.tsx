import type { ReactNode } from 'react';
import HeroPicture from '@/components/marketing/HeroPicture';

export default function EmployersLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <HeroPicture
        src="/images/pages/business-meeting.webp"
        alt="Employer partnership and workforce planning meeting"
        microLabel="For Employers"
        analyticsName="employers"
        priority={false}
      />
      {children}
    </>
  );
}
