import { redirect } from 'next/navigation';

import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Staff Dashboard | {PLATFORM_DEFAULTS.orgName}',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/portal/staff/dashboard',
  },
  robots: { index: false, follow: false },
};

export default function StaffDashboardRedirect() {
  redirect('/staff-portal/dashboard');
}
