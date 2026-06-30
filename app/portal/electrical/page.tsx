import { Metadata } from 'next';
import { ApprenticePortalShell } from '@/components/portal/ApprenticePortalShell';
import { loadApprenticePortalData } from '@/lib/portal/load-apprentice-portal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Electrical Apprenticeship Dashboard',
  description: 'Track your electrical apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

export default async function ElectricalPortalPage() {
  const data = await loadApprenticePortalData('electrical');
  return <ApprenticePortalShell {...data} />;
}
