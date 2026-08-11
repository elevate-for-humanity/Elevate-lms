import { notFound } from 'next/navigation';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import ProgramSeoStructuredData from '@/components/programs/ProgramSeoStructuredData';
import BeautyProgramSearchSection from '@/components/programs/beauty/BeautyProgramSearchSection';
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

  return (
    <>
      <ProgramSeoStructuredData
        program={loaded.program}
        canonicalPath="/programs/cosmetology-apprenticeship"
      />
      <ProgramDetailPage program={loaded.program} banner={banner} heroOverride={heroOverride}>
        <BeautyProgramSearchSection program={loaded.program} />
      </ProgramDetailPage>
    </>
  );
}

export async function generateMetadata() {
  return {
    title: 'Registered Cosmetology Apprenticeship in Indiana | Elevate for Humanity',
    description:
      'Indiana cosmetology apprenticeship with supervised salon training, related technical instruction, host-shop placement pathways and sponsor oversight. Funding eligibility is reviewed separately and is not guaranteed.',
    keywords: [
      'cosmetology apprenticeship',
      'cosmetology apprenticeship Indiana',
      'Indiana cosmetology apprenticeship program',
      'paid cosmetology apprenticeship',
      'registered cosmetology apprenticeship',
      'salon apprenticeship Indiana',
      'cosmetology license apprenticeship',
      'earn while you learn cosmetology',
    ],
    alternates: {
      canonical: 'https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship',
    },
    openGraph: {
      title: 'Registered Cosmetology Apprenticeship in Indiana',
      description:
        'Explore supervised salon training, related technical instruction, host-shop pathways and the verified funding status for Elevate’s Indiana cosmetology apprenticeship.',
      url: 'https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship',
      type: 'website',
    },
  };
}
