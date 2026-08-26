import { notFound } from 'next/navigation';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import BeautyApprenticeshipAuthority, { buildBeautyProgramStructuredData } from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import heroBanners from '@/content/heroBanners';
import { loadProgramForPage } from '@/lib/programs/load-program-page';
import { getStaticProgram } from '@/data/programs';

export const revalidate = 3600;

export default async function CosmetologyApprenticeshipPage() {
  const loaded = await loadProgramForPage('cosmetology-apprenticeship');
  const program = loaded?.program ?? getStaticProgram('cosmetology-apprenticeship');
  if (!program) return notFound();
  const banner = heroBanners['cosmetology-apprenticeship'] ?? null;
  const structuredData = buildBeautyProgramStructuredData(program);
  const heroOverride = banner?.videoSrcDesktop ? (
    <HeroVideo
      videoSrcDesktop={banner.videoSrcDesktop}
      videoSrcMobile={banner.videoSrcMobile ?? banner.videoSrcDesktop}
      posterImage={banner.posterImage || program.heroImage}
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <ProgramDetailPage program={program} banner={banner} heroOverride={heroOverride}>
        <BeautyApprenticeshipAuthority program={program} />
      </ProgramDetailPage>
    </>
  );
}

export async function generateMetadata() {
  return {
    title: 'Cosmetology Apprenticeship Program | Indiana | Elevate for Humanity',
    description:
      'Indiana cosmetology apprenticeship pathway with 2,000 hours of supervised salon training, related instruction, host-site placement, progress tracking and licensing preparation. Current funding status is verified per program before enrollment.',
    keywords: [
      'cosmetology apprenticeship Indiana',
      'Indiana cosmetology apprenticeship program',
      'hair stylist apprenticeship Indiana',
      'salon apprenticeship Indianapolis',
      'earn while you learn cosmetology',
      'cosmetology training Indiana',
      'Indiana cosmetology license pathway',
    ],
    alternates: {
      canonical: 'https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship',
    },
    openGraph: {
      title: 'Cosmetology Apprenticeship Program | Indiana',
      description: 'Complete supervised salon training and related instruction with Elevate’s cosmetology apprenticeship pathway. Funding eligibility varies and is reviewed before enrollment.',
      url: 'https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship',
      type: 'website',
    },
  };
}
