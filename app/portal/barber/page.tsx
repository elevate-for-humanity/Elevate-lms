import { Metadata } from 'next';
import { ApprenticePortalShell } from '@/components/portal/ApprenticePortalShell';
import { loadApprenticePortalData } from '@/lib/portal/load-apprentice-portal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Barber Apprenticeship Dashboard',
  description: 'Track your barber apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

export default async function BarberPortalPage() {
  const data = await loadApprenticePortalData('barber-apprenticeship');
  return <ApprenticePortalShell {...data} />;
}
