import { loadProgramForPage } from '@/lib/programs/load-program-page';
import { normalizePublicProgram } from '@/data/programs';
import { ESTHETICIAN_APPRENTICESHIP } from '@/data/programs/esthetician-apprenticeship';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import BeautyApprenticeshipAuthority, { buildBeautyProgramStructuredData } from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import heroBanners from '@/content/heroBanners';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EstheticianApprenticeshipPage() {
  // Supabase remains the publication authority. The exact published slug must
  // exist, but this dedicated route always renders the canonical apprenticeship
  // schema so it can never inherit the separate five-week esthetician program.
  const published = await loadProgramForPage('esthetician-apprenticeship');
  if (!published) return notFound();

  const program = normalizePublicProgram({
    ...ESTHETICIAN_APPRENTICESHIP,
    title: 'Esthetician Apprenticeship Pathway',
    subtitle:
      'Indiana esthetician apprenticeship pathway with supervised spa or salon training, related instruction, documented progress, and preparation for the state licensing pathway. Indiana requires 700 hours of esthetics education. Federal Registered Apprenticeship status is not currently published for this occupation in Elevate’s canonical RAPIDS registry.',
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
    badge: 'Indiana Esthetics Pathway',
    badgeColor: 'blue',
    outcomes: ESTHETICIAN_APPRENTICESHIP.outcomes.map((outcome) => ({
      ...outcome,
      statement: outcome.statement.replace('Complete 700 hours of supervised spa/salon training', 'Complete the required 700 hours of Indiana esthetics education and supervised practice'),
    })),
    complianceAlignment: [
      {
        standard: 'Indiana State Board of Cosmetology and Barber Examiners — Esthetics Education',
        description:
          'Indiana publishes a 700-hour minimum education requirement for esthetician applicants. Program completion and licensure remain subject to current state requirements and board review.',
      },
    ],
    pricingIncludes: [
      '700 hours of esthetics education and supervised practice',
      'Related instruction and progress documentation',
      'Infection-control training',
      'CPR/First Aid training where included in the current enrollment package',
      'Licensing preparation',
    ],
    paymentTerms:
      'Review the current published self-pay price and checkout terms before enrollment. Third-party installment availability is determined at checkout.',
    faqs: [
      {
        question: 'How many esthetics education hours does Indiana require?',
        answer:
          'Indiana currently publishes a 700-hour minimum education requirement for esthetician applicants. Current licensing requirements should be confirmed with the Indiana Professional Licensing Agency before enrollment and application for licensure.',
      },
      {
        question: 'Is this occupation federally registered in RAPIDS through Elevate?',
        answer:
          'Federal Registered Apprenticeship status is not currently published for the esthetician occupation in Elevate’s canonical RAPIDS registry. The page therefore describes an Indiana esthetics apprenticeship pathway without claiming federal registration.',
      },
    ],
    metaTitle: 'Esthetician Apprenticeship Pathway | Indiana | Elevate for Humanity',
    metaDescription:
      'Indiana esthetician apprenticeship pathway with supervised training, related instruction, documented progress and preparation for Indiana’s 700-hour esthetics education and licensing requirements.',
  });

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
      belowHeroHeadline="Esthetician Apprenticeship Pathway — Indiana"
      belowHeroSubheadline="Supervised esthetics education and practice aligned to Indiana’s 700-hour education requirement, with documented progress and licensing preparation."
      ctas={[banner.primaryCta, banner.secondaryCta].filter(Boolean) as any}
      trustIndicators={['Indiana 700-hour esthetics education requirement', 'Supervised practice', 'Licensing preparation']}
      transcript="Explore Elevate’s Indiana esthetician apprenticeship pathway with supervised esthetics education and practice, related instruction, documented progress, and preparation for state licensing requirements."
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
