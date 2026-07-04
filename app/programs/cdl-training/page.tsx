export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { CDL_TRAINING } from '@/data/programs/cdl-training';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import CdlEnrollmentOpenBanner from '@/components/programs/CdlEnrollmentOpenBanner';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { resolveHeroPosterSrc } from '@/lib/images/hero-banner-media';

export const metadata: Metadata = {
  title: CDL_TRAINING.metaTitle ?? `${CDL_TRAINING.title} | ${PLATFORM_DEFAULTS.orgName}`,
  description: CDL_TRAINING.metaDescription,
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/cdl-training' },
};

export default function CDLTrainingPage() {
  const heroPosterSrc = resolveHeroPosterSrc(CDL_TRAINING.slug, {
    heroImage: CDL_TRAINING.heroImage,
  });
  return (
    <ProgramDetailPage 
      program={CDL_TRAINING} 
      heroPosterSrc={heroPosterSrc}
      announcement={<CdlEnrollmentOpenBanner />} 
    />
  );
}
