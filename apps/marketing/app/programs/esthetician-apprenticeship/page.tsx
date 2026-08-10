import { loadProgramForPage } from '@/lib/programs/load-program-page';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

export default async function EstheticianApprenticeshipPage() {
  const loaded = await loadProgramForPage('esthetician-apprenticeship');
  if (!loaded) return notFound();
  const banner = heroBanners['esthetician-apprenticeship'] ?? null;
  const heroOverride = banner?.videoSrcDesktop ? (
    <HeroVideo
      videoSrcDesktop={banner.videoSrcDesktop}
      videoSrcMobile={banner.videoSrcMobile ?? banner.videoSrcDesktop}
      posterImage={banner.posterImage || loaded.program.heroImage}
      voiceoverSrc={banner.voiceoverSrc}
      microLabel={banner.microLabel}
      analyticsName={banner.analyticsName}
      belowHeroHeadline={banner.belowHeroHeadline}
      belowHeroSubheadline={banner.belowHeroSubheadline}
      ctas={[banner.primaryCta, banner.secondaryCta].filter(Boolean) as any}
      trustIndicators={banner.trustIndicators}
      transcript={banner.transcript}
    />
  ) : undefined;

  return <ProgramDetailPage program={loaded.program} banner={banner} heroOverride={heroOverride} />;
}

export async function generateMetadata() {
  return {
    title: 'Esthetician Apprenticeship | Esthetics Earn-While-You-Learn',
    description:
      'Esthetician apprenticeship pathway with supervised on-the-job learning, related technical instruction, approved training sites, progress tracking and apprenticeship sponsor oversight.',
    keywords: [
      'esthetician apprenticeship',
      'esthetics apprenticeship',
      'esthetician apprenticeship Indiana',
      'paid esthetician apprenticeship',
      'spa apprenticeship',
      'esthetician training',
      'esthetics training',
    ],
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/esthetician-apprenticeship' },
  };
}
