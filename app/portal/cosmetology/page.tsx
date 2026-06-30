import { Metadata } from 'next';
import { ApprenticePortalShell } from '@/components/portal/ApprenticePortalShell';
import { loadApprenticePortalData } from '@/lib/portal/load-apprentice-portal';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Cosmetology Apprenticeship Dashboard',
  description: 'Track your cosmetology apprenticeship hours, competencies, and training progress.',
  robots: { index: false, follow: false },
};

export default async function CosmetologyPortalPage() {
  const data = await loadApprenticePortalData('cosmetology-apprenticeship');
  return <ApprenticePortalShell {...data} />;
}
