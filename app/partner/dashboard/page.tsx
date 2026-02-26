import { redirect } from 'next/navigation';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner Dashboard | Elevate for Humanity',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partner/dashboard',
  },
  robots: { index: false, follow: false },
};

export default function PartnerDashboardRedirect() {
  redirect('/partner-portal');
}
