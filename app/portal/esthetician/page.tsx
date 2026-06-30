import { Metadata } from 'next';
import { ApprenticePortalShell } from '@/components/portal/ApprenticePortalShell';
import { loadApprenticePortalData } from '@/lib/portal/load-apprentice-portal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Esthetician Apprenticeship Dashboard',
  description: 'Track your esthetician apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

export default async function EstheticianPortalPage() {
  const data = await loadApprenticePortalData('esthetician-apprenticeship');
  return <ApprenticePortalShell {...data} />;
}
