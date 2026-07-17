import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check Training Funding Eligibility',
  description:
    'Answer 3 questions to find out if you qualify for WIOA, Workforce Ready Grant, or JRI-funded career training. Takes 30 seconds.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/check-eligibility',
  },
};

export default function CheckEligibilityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
