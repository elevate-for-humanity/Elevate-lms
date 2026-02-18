import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner Portal',
  description: 'Access your partner dashboard and manage program enrollments.',
};


export default function PartnerPortalRedirect() {
  redirect('/partners/portal');
}
