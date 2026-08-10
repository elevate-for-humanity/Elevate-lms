import { loadProgramForPage } from '@/lib/programs/load-program-page';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

export default async function NailTechnicianApprenticeshipPage() {
  const loaded = await loadProgramForPage('nail-technician-apprenticeship');
  if (!loaded) return notFound();
  const banner = heroBanners['nail-technician-apprenticeship'] ?? null;
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
    title: 'Nail Technician & Manicuring Apprenticeship | Earn While You Learn',
    description:
      'Nail technician and manicuring apprenticeship pathway with supervised on-the-job learning, related technical instruction, salon training sites, progress tracking and sponsor oversight.',
    keywords: [
      'nail technician apprenticeship',
      'nail tech apprenticeship',
      'manicuring apprenticeship',
      'manicurist apprenticeship',
      'nail apprenticeship Indiana',
      'paid nail apprenticeship',
      'nail technician training',
    ],
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship' },
  };
}
