import { redirect } from 'next/navigation';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Staff Dashboard | Elevate for Humanity',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/portal/staff/dashboard',
  },
  robots: { index: false, follow: false },
};

export default function StaffDashboardRedirect() {
  redirect('/staff-portal/dashboard');
}
