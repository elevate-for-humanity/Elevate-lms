import { loadProgramForPage } from '@/lib/programs/load-program-page';
import { normalizePublicProgram } from '@/data/programs';
import { ESTHETICIAN_APPRENTICESHIP } from '@/data/programs/esthetician-apprenticeship';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import BeautyApprenticeshipAuthority, { buildBeautyProgramStructuredData } from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import JozannaIndustryInstructor from '@/components/programs/beauty/JozannaIndustryInstructor';
import FeaturedHostPartners from '@/components/programs/beauty/FeaturedHostPartners';
import heroBanners, { type HeroBannerConfig } from '@/content/heroBanners';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SAFE_HERO_COPY = {
  microLabel: 'DOL Registered • Competency Based',
  belowHeroHeadline: 'Esthetician Apprenticeship Pathway — Indiana',
  belowHeroSubheadline:
    'Complete 20 verified Appendix A occupational competencies and 300 hours of related instruction through supervised host-site training.',
  trustIndicators: [
    '20 Appendix A competencies',
    '300 related-instruction hours',
    'RAPIDS occupation 2089CB',
  ],
  transcript:
    'Explore Elevate’s registered, competency-based Esthetician Apprenticeship. Complete 20 verified Appendix A occupational competencies and 300 hours of related instruction through supervised host-site practice.',
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
      'DOL-registered, competency-based esthetician apprenticeship requiring 20 verified occupational competencies and 300 related-instruction hours, with supervised host-site training and licensing preparation.',
    durationWeeks: 0,
    hoursPerWeekMin: 25,
    hoursPerWeekMax: 25,
    hoursBreakdown: {
      onlineInstruction: 300,
      handsOnLab: 0,
      examPrep: 0,
      careerPlacement: 0,
    },
    schedule: 'Competency-based progression through 20 Appendix A competencies, with 300 required related-instruction hours and supervised host-site practice.',
    fundingStatement:
      'Self-pay enrollment is available. Any employer or workforce funding must be confirmed in writing for the individual participant before enrollment.',
    fundingOptions: ['self_pay'],
    complianceAlignment: [
      {
        standard: 'U.S. Department of Labor Appendix A — Esthetician (RAPIDS 2089CB)',
        description:
          'Registered-program completion is competency-based: 20 verified competencies plus 300 related-instruction hours. State licensing requirements are tracked separately.',
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
      'Registered competency-based esthetician apprenticeship with 20 occupational competencies, 300 related-instruction hours, supervised host-site practice, and licensing preparation.',
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
      <ProgramDetailPage
        program={program}
        banner={safeBanner}
        heroOverride={heroOverride}
        featuredContent={<FeaturedHostPartners programSlug="esthetician-apprenticeship" />}
      >
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
      'Registered competency-based esthetician apprenticeship with 20 occupational competencies, 300 related-instruction hours, supervised host-site practice, and licensing preparation.',
    keywords: [
      'esthetician apprenticeship Indiana',
      'esthetics apprenticeship Indiana',
      'Indiana esthetician apprenticeship program',
      'esthetician apprenticeship Indianapolis',
      'spa apprenticeship Indiana',
      'Indiana esthetician license pathway',
      'competency based esthetician apprenticeship Indiana',
    ],
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/esthetician-apprenticeship' },
    openGraph: {
      title: 'Esthetician Apprenticeship Pathway | Indiana',
      description:
        'Registered competency-based esthetician apprenticeship requiring 20 verified competencies and 300 related-instruction hours.',
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
