import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Check Workforce-Funding Eligibility | Elevate for Humanity',
  description:
    'Review the application pathway for CDL, HVAC, Business Administration, and Financial Literacy workforce-funding consideration. Agency authorization is required.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/check-eligibility' },
  openGraph: {
    title: 'Check Workforce-Funding Eligibility | Elevate for Humanity',
    description:
      'Review the four confirmed workforce-fundable programs and prepare for WorkOne or agency eligibility review.',
    url: 'https://www.elevateforhumanity.org/check-eligibility',
    type: 'website',
  },
};

export default function CheckEligibilityLayout({ children }: { children: ReactNode }) {
  return children;
}
