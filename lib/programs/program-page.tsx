import type { Metadata } from 'next';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import type { ProgramSchema } from '@/lib/programs/program-schema';
import heroBanners from '@/content/heroBanners';

export function buildProgramMetadata(program: ProgramSchema): Metadata {
  return {
    title: program.metaTitle,
    description: program.metaDescription,
    alternates: {
      canonical: `https://www.elevateforhumanity.org/programs/${program.slug}`,
    },
  };
}

export function ProgramMarketingPage({ program }: { program: ProgramSchema }) {
  const banner = heroBanners[program.slug] ?? null;
  return <ProgramDetailPage program={program} banner={banner} />;
}
