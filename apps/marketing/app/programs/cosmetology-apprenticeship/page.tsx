import { notFound } from 'next/navigation';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import heroBanners from '@/content/heroBanners';
import { loadProgramForPage } from '@/lib/programs/load-program-page';

export const revalidate = 3600;

export default async function CosmetologyApprenticeshipPage() {
  const loaded = await loadProgramForPage('cosmetology-apprenticeship');
  if (!loaded) return notFound();
  const banner = heroBanners['cosmetology-apprenticeship'] ?? null;
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
    title: 'Cosmetology & Hair Stylist Apprenticeship | Earn While You Learn',
    description:
      'Cosmetology and hair stylist apprenticeship pathway with structured on-the-job learning, related technical instruction, employer training sites, progress tracking and apprenticeship sponsor oversight.',
    keywords: [
      'cosmetology apprenticeship',
      'hair stylist apprenticeship',
      'hairstylist apprenticeship',
      'cosmetology apprenticeship Indiana',
      'paid cosmetology apprenticeship',
      'salon apprenticeship',
      'cosmetology training',
    ],
    alternates: {
      canonical: 'https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship',
    },
  };
}
