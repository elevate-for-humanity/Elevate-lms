import { redirect } from 'next/navigation';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Program Admin Dashboard | Elevate for Humanity',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/programs/admin/dashboard',
  },
  robots: { index: false, follow: false },
};

export default function ProgramAdminDashboardRedirect() {
  redirect('/programs/admin');
}
