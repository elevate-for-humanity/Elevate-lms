import { Metadata } from 'next';
import { ApprenticePortalShell } from '@/components/portal/ApprenticePortalShell';
import { loadApprenticePortalData } from '@/lib/portal/load-apprentice-portal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Plumbing Apprenticeship Dashboard',
  description: 'Track your plumbing apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

export default async function PlumbingPortalPage() {
  const data = await loadApprenticePortalData('plumbing');
  return <ApprenticePortalShell {...data} />;
}
