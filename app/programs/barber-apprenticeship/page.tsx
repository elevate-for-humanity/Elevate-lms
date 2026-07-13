import BarberApprenticeshipClient from './BarberApprenticeshipClient';
import { programs as staticPrograms } from '@/content/cf-programs';
import { getStaticProgram } from '@/data/programs/index';
import heroBanners from '@/content/heroBanners';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const PROGRAM_SLUG = 'barber-apprenticeship';

export async function generateMetadata(): Promise<Metadata> {
  const sp = getStaticProgram(PROGRAM_SLUG);
  if (sp) {
    return {
      title: sp.metaTitle || sp.title,
      description: sp.metaDescription || sp.subtitle,
      alternates: { canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship' },
    };
  }
  const cfp = staticPrograms.find((p) => p.slug === PROGRAM_SLUG);
  if (cfp) {
    return {
      title: cfp.title,
      description: cfp.summary,
      alternates: { canonical: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship' },
    };
  }
  return {};
}

export default async function BarberApprenticeshipPage() {
  const sp = getStaticProgram(PROGRAM_SLUG);
  const banner = heroBanners[PROGRAM_SLUG] ?? null;

  return (
    <BarberApprenticeshipClient
      program={sp!}
      heroBanner={banner}
    />
  );
}
