import { loadProgramForPage } from '@/lib/programs/load-program-page';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import BeautyApprenticeshipAuthority, { buildBeautyProgramStructuredData } from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import heroBanners from '@/content/heroBanners';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EstheticianApprenticeshipPage() {
  const loaded = await loadProgramForPage('esthetician-apprenticeship');
  if (!loaded) return notFound();

  // Public esthetics licensing information must remain consistent with Indiana's
  // 700-hour education requirement and must not imply federal RAPIDS registration
  // unless the canonical registered-program contract contains this occupation.
  const program = {
    ...loaded.program,
    subtitle:
      'Indiana esthetician apprenticeship pathway with supervised spa or salon training, related instruction, documented progress, and preparation for the state licensing pathway. Indiana requires 700 hours of esthetics education; federal Registered Apprenticeship status is not currently published for this occupation in Elevate’s canonical RAPIDS registry.',
    hoursBreakdown: {
      onlineInstruction: 230,
      handsOnLab: 400,
      examPrep: 70,
      careerPlacement: 0,
    },
    fundingStatement:
      'Self-pay enrollment is available. Any employer or workforce funding must be confirmed in writing for the individual participant before enrollment.',
    fundingOptions: ['self_pay'] as const,
    badge: 'Indiana Esthetics Pathway',
    badgeColor: 'blue' as const,
  };

  const banner = heroBanners['esthetician-apprenticeship'] ?? null;
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
    title: 'Esthetician Apprenticeship Pathway | Indiana | Elevate for Humanity',
    description:
      'Indiana esthetician apprenticeship pathway with supervised spa training, related instruction, documented progress and preparation for Indiana’s 700-hour esthetics education and licensing requirements.',
    keywords: [
      'esthetician apprenticeship Indiana',
      'esthetics apprenticeship Indiana',
      'Indiana esthetician apprenticeship program',
      'esthetician apprenticeship Indianapolis',
      'spa apprenticeship Indiana',
      'Indiana esthetician license pathway',
      '700 hour esthetician training Indiana',
    ],
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/esthetician-apprenticeship' },
    openGraph: {
      title: 'Esthetician Apprenticeship Pathway | Indiana',
      description:
        'Supervised spa training, related instruction, documented progress and preparation for Indiana’s 700-hour esthetics education and licensing requirements.',
      url: 'https://www.elevateforhumanity.org/programs/esthetician-apprenticeship',
      type: 'website',
    },
  };
}
