import { notFound } from 'next/navigation';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import BeautyApprenticeshipAuthority, {
  buildBeautyProgramStructuredData,
} from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import FeaturedHostPartners from '@/components/programs/beauty/FeaturedHostPartners';
import heroBanners from '@/content/heroBanners';
import { loadProgramForPage } from '@/lib/programs/load-program-page';
import { getStaticProgram } from '@/data/programs';

export const revalidate = 3600;

export default async function CosmetologyApprenticeshipPage() {
  const loaded = await loadProgramForPage('cosmetology-apprenticeship');
  const program = loaded?.program ?? getStaticProgram('cosmetology-apprenticeship');
  if (!program) return notFound();
  const baseBanner = heroBanners['cosmetology-apprenticeship'] ?? null;
  const banner = baseBanner
    ? {
        ...baseBanner,
        voiceoverSrc: undefined,
        videoSrcDesktop: undefined,
        videoSrcMobile: undefined,
        belowHeroHeadline: 'Build your cosmetology career through supervised salon training.',
        belowHeroSubheadline:
          'Learn in a licensed Host Salon, complete required instruction, document your hours and skills, and prepare for the applicable Indiana licensing process.',
        trustIndicators: [
          'Supervised salon training',
          'Related Technical Instruction',
          'Hours and competency tracking',
          'Licensing preparation',
        ],
        transcript:
          'Cosmetology Apprenticeship — Program Page Guide. Start by applying to Elevate and reviewing the program requirements. Elevate confirms enrollment, instruction, records, and the available payment or funding path. An approved Host Salon employs and supervises the apprentice during hands-on training. The apprentice completes Related Technical Instruction, records attendance and hours, demonstrates required competencies, and follows the applicable Indiana testing and licensing process. Self-pay students may pay in full or review an available buy now, pay later option. Buy now, pay later is offered by an outside provider, requires separate approval, and is subject to that provider’s payment schedule, fees, and agreement.',
      }
    : null;
  const structuredData = buildBeautyProgramStructuredData(program);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <ProgramDetailPage
        program={program}
        banner={banner}
        featuredContent={<FeaturedHostPartners programSlug="cosmetology-apprenticeship" />}
      >
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
      description:
        'Complete supervised salon training and related instruction with Elevate’s cosmetology apprenticeship pathway. Funding eligibility varies and is reviewed before enrollment.',
      url: 'https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship',
      type: 'website',
    },
  };
}
