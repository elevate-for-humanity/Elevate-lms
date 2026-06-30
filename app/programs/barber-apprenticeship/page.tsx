import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { BARBER_APPRENTICESHIP } from '@/data/programs/barber-apprenticeship';
import { validateProgram } from '@/lib/programs/program-schema';
import heroBanners from '@/content/heroBanners';
import { createClient } from '@/lib/supabase/server';
import BarberApprenticeshipClient from './BarberApprenticeshipClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const p = BARBER_APPRENTICESHIP;

const errors = validateProgram(p);
if (errors.length > 0) {
  throw new Error(
    `Barber Apprenticeship program schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: '/programs/barber-apprenticeship' },
};

export default async function BarberApprenticeshipPage() {
  const heroBanner = heroBanners['barber-apprenticeship'] ?? null;

  // Live enrollment count from DB
  let enrollmentCount = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_slug', 'barber-apprenticeship')
      .eq('status', 'active');
    enrollmentCount = count ?? 0;
  } catch {
    // non-fatal — fall back to 0
  }

  return (
    <>
      <ProgramStructuredData
        program={{
          id: p.slug,
          name: p.title,
          slug: p.slug,
          description: p.subtitle,
          duration_weeks: p.durationWeeks,
          price: parseInt(p.selfPayCost.replace(/[^0-9]/g, ''), 10),
          image_url: p.heroImage,
          category: p.category,
          outcomes: p.outcomes.map((o) => o.statement),
        }}
      />
      <BarberApprenticeshipClient program={p} heroBanner={heroBanner} enrollmentCount={enrollmentCount} />
    </>
  );
}
