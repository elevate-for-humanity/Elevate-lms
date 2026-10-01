import { notFound } from 'next/navigation';

import { BeautyEnrollmentPromotion } from '@/components/promotions/BeautyEnrollmentPromotion';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import BeautyApprenticeshipAuthority, {
  buildBeautyProgramStructuredData,
} from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import CosmetologyVisualExperience from '@/components/programs/beauty/CosmetologyVisualExperience';
import FeaturedHostPartners from '@/components/programs/beauty/FeaturedHostPartners';
import HostShopPlacementGuide from '@/components/programs/beauty/HostShopPlacementGuide';
import ApprenticeshipExperienceGuide from '@/components/programs/beauty/ApprenticeshipExperienceGuide';
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
          'Registered Hair Stylist/Cosmetologist occupation 0096HY V1: complete the 2,000–2,500-hour hybrid term, 154 RTI hours, supervised Host Salon training, required work processes, and the applicable Indiana examination and licensing process.',
        trustIndicators: [
          'Supervised salon training',
          'Related Technical Instruction',
          'Hours and competency tracking',
          'Licensing preparation',
        ],
        transcript:
          'Hair Stylist, existing title Cosmetologist, is registered in RAPIDS as occupation 0096HY V1 using a hybrid model. Apprentices complete a 2,000 to 2,500 hour registered term, including 154 hours of Related Technical Instruction, supervised Host Salon training, required work processes, and program records. The 500-hour figure is the probationary period, not graduation. After registered apprenticeship completion, the apprentice follows the applicable Indiana examination and licensing process.',
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
        heroOverride={<CosmetologyVisualExperience />}
        afterHero={<BeautyEnrollmentPromotion />}
        featuredContent={
          <>
            <ApprenticeshipExperienceGuide programTitle={program.title} applyHref={program.cta.applyHref} />
            <FeaturedHostPartners programSlug="cosmetology-apprenticeship" />
            <HostShopPlacementGuide programSlug="cosmetology-apprenticeship" />
          </>
        }
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
      'Registered Indiana Hair Stylist/Cosmetologist apprenticeship, RAPIDS 0096HY V1: hybrid 2,000–2,500-hour term, 154 RTI hours, 500-hour probation, supervised Host Salon training, progress tracking, and licensing preparation.',
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
        'Registered Hair Stylist/Cosmetologist apprenticeship (0096HY V1) with a 2,000–2,500-hour hybrid term, 154 RTI hours, supervised Host Salon training, and licensing preparation.',
      url: 'https://www.elevateforhumanity.org/programs/cosmetology-apprenticeship',
      type: 'website',
    },
  };
}
