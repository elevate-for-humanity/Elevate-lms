import { notFound } from 'next/navigation';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import BarberApprenticeshipExtras from '@/components/programs/beauty/BarberApprenticeshipExtras';
import BeautyApprenticeshipAuthority, { buildBeautyProgramStructuredData } from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import heroBanners from '@/content/heroBanners';
import { loadProgramForPage } from '@/lib/programs/load-program-page';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function BarberApprenticeshipPage() {
  const loaded = await loadProgramForPage('barber-apprenticeship');
  if (!loaded) return notFound();
  const structuredData = buildBeautyProgramStructuredData(loaded.program);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <ProgramDetailPage
        program={loaded.program}
        banner={heroBanners['barber-apprenticeship'] ?? null}
      >
        <BarberApprenticeshipExtras />
        <BeautyApprenticeshipAuthority program={loaded.program} />
      </ProgramDetailPage>
    </>
  );
}

export async function generateMetadata() {
  return {
    title: 'Registered Barber Apprenticeship Program | Indiana | Elevate for Humanity',
    description:
      'Indiana barber apprenticeship through Elevate for Humanity with 2,000 OJL hours, 144 hours of Related Technical Instruction, approved Host Shops, digital hour tracking and sponsor oversight. Funding varies by participant and source.',
    keywords: [
      'barber apprenticeship Indiana',
      'registered barber apprenticeship',
      'Indiana barber apprenticeship program',
      'barber apprentice program Indianapolis',
      'earn while you learn barber',
      'host barbershop apprenticeship',
      'Indiana barber license apprenticeship',
    ],
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship' },
    openGraph: {
      title: 'Registered Barber Apprenticeship Program | Indiana',
      description: 'Train through supervised OJL, Related Technical Instruction, Host Shop placement and digital progress tracking with Elevate for Humanity.',
      url: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship',
      type: 'website',
    },
  };
}
