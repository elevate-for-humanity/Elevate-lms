import { Metadata } from 'next';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import { HOME_HEALTH_AIDE } from '@/data/programs/home-health-aide';
import { validateProgram } from '@/lib/programs/program-schema';

export const dynamic = 'force-static';
export const revalidate = 86400;

const p = HOME_HEALTH_AIDE;

const errors = validateProgram(p);
if (errors.length > 0) {
  throw new Error(
    `Home Health Aide program schema validation failed:\n${errors.map((e) => `  ${e.field}: ${e.message}`).join('\n')}`
  );
}

export const metadata: Metadata = {
  title: p.metaTitle,
  description: p.metaDescription,
  alternates: { canonical: '/programs/home-health-aide' },
};

export default function HomeHealthAidePage() {
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
      <ProgramDetailPage program={p} />
    </>
  );
}
