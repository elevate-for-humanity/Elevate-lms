import { loadProgramForPage } from '@/lib/programs/load-program-page';
import { normalizePublicProgram } from '@/data/programs';
import { ESTHETICIAN_APPRENTICESHIP } from '@/data/programs/esthetician-apprenticeship';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import BeautyApprenticeshipAuthority, { buildBeautyProgramStructuredData } from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import JozannaIndustryInstructor from '@/components/programs/beauty/JozannaIndustryInstructor';
import heroBanners, { type HeroBannerConfig } from '@/content/heroBanners';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SAFE_HERO_COPY = {
  microLabel: 'Indiana Esthetics Pathway',
  belowHeroHeadline: 'Esthetician Apprenticeship Pathway — Indiana',
  belowHeroSubheadline:
    'Supervised esthetics education and practice aligned to Indiana’s 700-hour education requirement, with documented progress and licensing preparation.',
  trustIndicators: [
    'Indiana 700-hour esthetics education requirement',
    'Supervised practice',
    'Licensing preparation',
  ],
  transcript:
    'Explore Elevate’s Indiana esthetician apprenticeship pathway with supervised esthetics education and practice, related instruction, documented progress, and preparation for state licensing requirements.',
} as const;

export default async function EstheticianApprenticeshipPage() {
  // Supabase remains the publication authority. The exact published slug must
  // exist, but this dedicated route always renders the canonical apprenticeship
  // schema so it can never inherit the separate five-week esthetician program.
  await loadProgramForPage('esthetician-apprenticeship');
  // This dedicated public route has a governed static definition and must stay
  // available during a transient CMS/Supabase read failure.

  const normalizedProgram = normalizePublicProgram({
    ...ESTHETICIAN_APPRENTICESHIP,
    title: 'Esthetician Apprenticeship',
    subtitle:
      'Indiana esthetician pathway with supervised spa or salon training, related instruction, documented progress, and preparation for the state licensing pathway. Indiana requires 700 hours of esthetics education.',
    durationWeeks: 28,
    hoursPerWeekMin: 25,
    hoursPerWeekMax: 25,
    hoursBreakdown: {
      onlineInstruction: 230,
      handsOnLab: 400,
      examPrep: 70,
      careerPlacement: 0,
    },
    schedule: 'Approximately 25 hours per week across supervised esthetics education and practice.',
    fundingStatement:
      'Self-pay enrollment is available. Any employer or workforce funding must be confirmed in writing for the individual participant before enrollment.',
    fundingOptions: ['self_pay'],
    complianceAlignment: [
      {
        standard: 'Indiana State Board of Cosmetology and Barber Examiners — Esthetics Education',
        description:
          'Indiana publishes a 700-hour minimum education requirement for esthetician applicants. Program completion and licensure remain subject to current state requirements and board review.',
      },
    ],
  });

  // Keep the public search-intent name explicit while retaining the canonical
  // normalizer's funding and federal-registration disclosure protections.
  const program = {
    ...normalizedProgram,
    title: 'Esthetician Apprenticeship Pathway',
    badge: 'Indiana Esthetics Pathway',
    badgeColor: 'blue' as const,
    metaTitle: 'Esthetician Apprenticeship Pathway | Indiana | Elevate for Humanity',
    metaDescription:
      'Indiana esthetician apprenticeship pathway with supervised training, related instruction, documented progress and preparation for Indiana’s 700-hour esthetics education and licensing requirements.',
  };

  const rawBanner = heroBanners['esthetician-apprenticeship'] ?? null;
  const safeBanner: HeroBannerConfig | null = rawBanner
    ? {
        ...rawBanner,
        microLabel: SAFE_HERO_COPY.microLabel,
        belowHeroHeadline: SAFE_HERO_COPY.belowHeroHeadline,
        belowHeroSubheadline: SAFE_HERO_COPY.belowHeroSubheadline,
        trustIndicators: [...SAFE_HERO_COPY.trustIndicators],
        transcript: SAFE_HERO_COPY.transcript,
      }
    : null;

  const structuredData = buildBeautyProgramStructuredData(program);
  const heroOverride = safeBanner?.videoSrcDesktop ? (
    <HeroVideo
      videoSrcDesktop={safeBanner.videoSrcDesktop}
      videoSrcMobile={safeBanner.videoSrcMobile ?? safeBanner.videoSrcDesktop}
      posterImage={safeBanner.posterImage || program.heroImage}
      voiceoverSrc={safeBanner.voiceoverSrc}
      microLabel={SAFE_HERO_COPY.microLabel}
      analyticsName={safeBanner.analyticsName}
      belowHeroHeadline={SAFE_HERO_COPY.belowHeroHeadline}
      belowHeroSubheadline={SAFE_HERO_COPY.belowHeroSubheadline}
      ctas={[safeBanner.primaryCta, safeBanner.secondaryCta].filter(Boolean) as any}
      trustIndicators={[...SAFE_HERO_COPY.trustIndicators]}
      transcript={SAFE_HERO_COPY.transcript}
    />
  ) : undefined;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <ProgramDetailPage program={program} banner={safeBanner} heroOverride={heroOverride}>
        <div className="space-y-10">
          <JozannaIndustryInstructor industry="esthetician" />
          <BeautyApprenticeshipAuthority program={program} />
        </div>
      </ProgramDetailPage>
    </>
  );
}

export async function generateMetadata() {
  return {
    title: 'Esthetician Apprenticeship Pathway | Indiana | Elevate for Humanity',
    description:
      'Indiana esthetician apprenticeship pathway with supervised training, related instruction, documented progress and preparation for Indiana’s 700-hour esthetics education and licensing requirements.',
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
        'Supervised esthetics education and practice aligned to Indiana’s 700-hour education requirement, with documented progress and licensing preparation.',
      url: 'https://www.elevateforhumanity.org/programs/esthetician-apprenticeship',
      type: 'website',
      images: [
        {
          url: 'https://www.elevateforhumanity.org/images/pexels/esthetician.webp',
          alt: 'Esthetician apprentice completing supervised skincare training in Indiana',
        },
      ],
    },
  };
}
