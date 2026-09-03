import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prepare for Workforce Funding Review | Elevate for Humanity',
  description:
    'Prepare for a WorkOne or agency funding review. This route does not determine eligibility or issue funding approval.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/check-eligibility' },
};

export default function CheckEligibilityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
