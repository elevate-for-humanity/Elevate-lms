import { loadProgramForPage } from '@/lib/programs/load-program-page';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import BeautyApprenticeshipAuthority, { buildBeautyProgramStructuredData } from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import heroBanners from '@/content/heroBanners';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

export default async function EstheticianApprenticeshipPage() {
  const loaded = await loadProgramForPage('esthetician-apprenticeship');
  if (!loaded) return notFound();
  const banner = heroBanners['esthetician-apprenticeship'] ?? null;
  const structuredData = buildBeautyProgramStructuredData(loaded.program);
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <ProgramDetailPage program={loaded.program} banner={banner} heroOverride={heroOverride}>
        <BeautyApprenticeshipAuthority program={loaded.program} />
      </ProgramDetailPage>
    </>
  );
}

export async function generateMetadata() {
  return {
    title: 'Esthetician Apprenticeship Program | Indiana | Elevate for Humanity',
    description:
      'Indiana esthetician apprenticeship pathway with supervised spa training, related technical instruction, host-site oversight, digital progress tracking and licensing preparation. Funding status is reviewed before enrollment.',
    keywords: [
      'esthetician apprenticeship Indiana',
      'esthetics apprenticeship Indiana',
      'Indiana esthetician apprenticeship program',
      'esthetician apprenticeship Indianapolis',
      'spa apprenticeship Indiana',
      'earn while you learn esthetics',
      'Indiana esthetician license pathway',
    ],
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/esthetician-apprenticeship' },
    openGraph: {
      title: 'Esthetician Apprenticeship Program | Indiana',
      description: 'Supervised spa training, related technical instruction, host-site oversight and licensing preparation through Elevate’s Indiana esthetician apprenticeship pathway.',
      url: 'https://www.elevateforhumanity.org/programs/esthetician-apprenticeship',
      type: 'website',
    },
  };
}
