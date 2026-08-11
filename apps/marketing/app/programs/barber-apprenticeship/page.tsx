import { notFound } from 'next/navigation';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import BarberApprenticeshipExtras from '@/components/programs/beauty/BarberApprenticeshipExtras';
import ProgramSeoStructuredData from '@/components/programs/ProgramSeoStructuredData';
import heroBanners from '@/content/heroBanners';
import { loadProgramForPage } from '@/lib/programs/load-program-page';

// Marketing deployment touch: publish the consolidated header and current host-shop media bundle.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function BarberApprenticeshipPage() {
  const loaded = await loadProgramForPage('barber-apprenticeship');
  if (!loaded) return notFound();

  return (
    <>
      <ProgramSeoStructuredData
        program={loaded.program}
        canonicalPath="/programs/barber-apprenticeship"
      />
      <ProgramDetailPage
        program={loaded.program}
        banner={heroBanners['barber-apprenticeship'] ?? null}
      >
        <BarberApprenticeshipExtras />
      </ProgramDetailPage>
    </>
  );
}

export async function generateMetadata() {
  return {
    title: 'Registered Barber Apprenticeship Program | Indiana | Elevate for Humanity',
    description:
      'Indiana registered barber apprenticeship pathway with approved host shops, supervised on-the-job learning, related technical instruction, progress tracking and sponsor oversight. Funding is not guaranteed; self-pay and other eligible options are reviewed separately.',
    keywords: [
      'barber apprenticeship',
      'barber apprenticeship Indiana',
      'Indiana barber apprenticeship program',
      'paid barber apprenticeship',
      'registered barber apprenticeship',
      'barber training Indiana',
      'barber license apprenticeship',
      'host barbershop apprenticeship',
    ],
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship' },
    openGraph: {
      title: 'Registered Barber Apprenticeship Program | Indiana',
      description:
        'Train in an approved Indiana host shop through a registered barber apprenticeship with supervised OJL, RTI, progress tracking and sponsor oversight.',
      url: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship',
      type: 'website',
    },
  };
}
