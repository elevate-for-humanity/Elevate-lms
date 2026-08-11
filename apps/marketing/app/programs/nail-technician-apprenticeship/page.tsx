import { loadProgramForPage } from '@/lib/programs/load-program-page';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import ProgramSeoStructuredData from '@/components/programs/ProgramSeoStructuredData';
import BeautyProgramSearchSection from '@/components/programs/beauty/BeautyProgramSearchSection';
import heroBanners from '@/content/heroBanners';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

export default async function NailTechnicianApprenticeshipPage() {
  const loaded = await loadProgramForPage('nail-technician-apprenticeship');
  if (!loaded) return notFound();
  const banner = heroBanners['nail-technician-apprenticeship'] ?? null;
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
        canonicalPath="/programs/nail-technician-apprenticeship"
      />
      <ProgramDetailPage program={loaded.program} banner={banner} heroOverride={heroOverride}>
        <BeautyProgramSearchSection program={loaded.program} />
      </ProgramDetailPage>
    </>
  );
}

export async function generateMetadata() {
  return {
    title: 'Nail Technician & Manicurist Apprenticeship in Indiana | Elevate for Humanity',
    description:
      'Indiana nail technician and manicurist apprenticeship with supervised salon training, technical instruction, host-shop pathways and sponsor oversight. Funding eligibility is reviewed separately and is not guaranteed.',
    keywords: [
      'nail technician apprenticeship',
      'nail tech apprenticeship Indiana',
      'manicurist apprenticeship Indiana',
      'Indiana nail technician apprenticeship',
      'paid nail apprenticeship',
      'registered nail apprenticeship',
      'nail salon apprenticeship',
      'Indiana manicurist license apprenticeship',
    ],
    alternates: {
      canonical: 'https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship',
    },
    openGraph: {
      title: 'Nail Technician & Manicurist Apprenticeship in Indiana',
      description:
        'Explore supervised salon training, technical instruction, host-shop pathways and the verified funding status for Elevate’s Indiana nail technician apprenticeship.',
      url: 'https://www.elevateforhumanity.org/programs/nail-technician-apprenticeship',
      type: 'website',
    },
  };
}
