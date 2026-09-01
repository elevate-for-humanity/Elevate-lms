import { loadProgramForPage } from '@/lib/programs/load-program-page';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import BeautyApprenticeshipAuthority, { buildBeautyProgramStructuredData } from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import JozannaIndustryInstructor from '@/components/programs/beauty/JozannaIndustryInstructor';
import heroBanners from '@/content/heroBanners';
import { notFound } from 'next/navigation';
import { getStaticProgram } from '@/data/programs';

export const revalidate = 3600;

export default async function NailTechnicianApprenticeshipPage() {
  const loaded = await loadProgramForPage('nail-technician-apprenticeship');
  const program = loaded?.program ?? getStaticProgram('nail-technician-apprenticeship');
  if (!program) return notFound();
  const banner = heroBanners['nail-technician-apprenticeship'] ?? null;
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
        <div className="space-y-10">
          <JozannaIndustryInstructor industry="nail-technician" />
          <BeautyApprenticeshipAuthority program={program} />
        </div>
      </ProgramDetailPage>
    </>
  );
}

export async function generateMetadata() {
  return {
    title: 'Nail Technician Apprenticeship Program | Indiana | Elevate for Humanity',
    description:
      'Indiana nail technician and manicurist apprenticeship pathway with 600 supervised hours, salon/spa training, related instruction, progress tracking and licensing preparation. Funding status is reviewed before enrollment.',
    keywords: [
      'nail technician apprenticeship Indiana',
      'nail tech apprenticeship Indiana',
      'manicurist apprenticeship Indiana',
      'nail salon apprenticeship Indianapolis',
      'earn while you learn nail technician',
      'Indiana nail technician license pathway',
    ],
    alternates: { canonical: 'https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship' },
    openGraph: {
      title: 'Nail Technician Apprenticeship Program | Indiana',
      description: 'Complete supervised salon/spa training and related instruction through Elevate’s nail technician apprenticeship pathway. Funding eligibility varies and is reviewed before enrollment.',
      url: 'https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship',
      type: 'website',
    },
  };
}
