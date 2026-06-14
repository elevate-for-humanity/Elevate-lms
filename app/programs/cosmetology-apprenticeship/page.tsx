import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import BarberApprenticeshipProcess from '@/components/programs/beauty/BarberApprenticeshipProcess';
import BarberApprenticeshipExtras from '@/components/programs/beauty/BarberApprenticeshipExtras';
import { COSMETOLOGY } from '@/data/programs/cosmetology-apprenticeship';
import { validateProgram } from '@/lib/programs/program-schema';
import heroBanners from '@/content/heroBanners';

export const dynamic = 'force-dynamic';

const p = COSMETOLOGY;

const errors = validateProgram(p);
if (errors.length > 0) {
  throw new Error(
    `Cosmetology Apprenticeship program schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: '/programs/cosmetology-apprenticeship' },
};

export default async function CosmetologyApprenticeshipPage() {
  const heroBanner = heroBanners['cosmetology-apprenticeship'] ?? null;

  return (
    <>
      <ProgramStructuredData
        program={{
          id: p.slug,
          name: p.title,
          slug: p.slug,
          description: p.subtitle,
          duration_weeks: p.durationWeeks,
          price: parseInt(p.selfPayCost.replace(/[^0-9]/g, ''), 10) || undefined,
          image_url: p.heroImage,
          category: p.category,
          outcomes: p.outcomes.map((o) => o.statement),
        }}
      />
      <ProgramDetailPage
        program={p}
        banner={heroBanner}
        processSlot={<BarberApprenticeshipProcess />}
      >
        <BarberApprenticeshipExtras />
      </ProgramDetailPage>
    </>
  );
}
