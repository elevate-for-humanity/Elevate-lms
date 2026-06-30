import { Metadata } from 'next';
import { ApprenticePortalShell } from '@/components/portal/ApprenticePortalShell';
import { loadApprenticePortalData } from '@/lib/portal/load-apprentice-portal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Nail Technician Apprenticeship Dashboard',
  description: 'Track your nail technician apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

export default async function NailTechnicianPortalPage() {
  const data = await loadApprenticePortalData('nail-technician-apprenticeship');
  return <ApprenticePortalShell {...data} />;
}
