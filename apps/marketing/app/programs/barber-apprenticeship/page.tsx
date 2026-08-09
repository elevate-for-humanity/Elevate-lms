import { notFound } from 'next/navigation';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import BarberApprenticeshipExtras from '@/components/programs/beauty/BarberApprenticeshipExtras';
import heroBanners from '@/content/heroBanners';
import { loadProgramForPage } from '@/lib/programs/load-program-page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function BarberApprenticeshipPage() {
  const loaded = await loadProgramForPage('barber-apprenticeship');
  if (!loaded) return notFound();

  return (
    <ProgramDetailPage
      program={loaded.program}
      banner={heroBanners['barber-apprenticeship'] ?? null}
    >
      <BarberApprenticeshipExtras />
    </ProgramDetailPage>
  );
}

export async function generateMetadata() {
  return {
    title: 'Barber Apprenticeship | Earn While You Learn Barbering',
    description:
      'Registered barber apprenticeship pathway from Elevate for Humanity in Indiana. Complete structured on-the-job learning with approved host shops, related technical instruction, hour tracking and sponsor oversight.',
    keywords: [
      'barber apprenticeship',
      'barber apprenticeship Indiana',
      'barber apprentice program',
      'paid barber apprenticeship',
      'registered barber apprenticeship',
      'barber training',
      'barber license apprenticeship',
    ],
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship' },
  };
}