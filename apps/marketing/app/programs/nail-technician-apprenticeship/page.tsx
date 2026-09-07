import { loadProgramForPage } from '@/lib/programs/load-program-page';
import ProgramDetailPage from '@/components/programs/ProgramDetailPage';
import HeroVideo from '@/components/marketing/HeroVideo';
import BeautyApprenticeshipAuthority, { buildBeautyProgramStructuredData } from '@/components/programs/beauty/BeautyApprenticeshipAuthority';
import JozannaIndustryInstructor from '@/components/programs/beauty/JozannaIndustryInstructor';
import FeaturedHostPartners from '@/components/programs/beauty/FeaturedHostPartners';
import heroBanners from '@/content/heroBanners';
import { notFound } from 'next/navigation';
import { getStaticProgram } from '@/data/programs';

export const revalidate = 3600;

export default async function NailTechnicianApprenticeshipPage() {
  const loaded = await loadProgramForPage('nail-technician-apprenticeship');
  const program = loaded?.program ?? getStaticProgram('nail-technician-apprenticeship');
  if (!program) return notFound();
  const rawBanner = heroBanners['nail-technician-apprenticeship'] ?? null;
  const banner = rawBanner ? { ...rawBanner, voiceoverSrc: undefined } : null;
  const structuredData = buildBeautyProgramStructuredData(program);
  const heroOverride = banner?.videoSrcDesktop ? (
    <HeroVideo
      videoSrcDesktop={banner.videoSrcDesktop}
      videoSrcMobile={banner.videoSrcMobile ?? banner.videoSrcDesktop}
      posterImage={banner.posterImage || program.heroImage}
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
      <ProgramDetailPage
        program={program}
        banner={banner}
        heroOverride={heroOverride}
        featuredContent={<FeaturedHostPartners programSlug="nail-technician-apprenticeship" />}
      >
        <div className="space-y-10">
          <JozannaIndustryInstructor industry="nail-technician" />
          <BeautyApprenticeshipAuthority program={program} />

      <section className="border-y border-emerald-200 bg-emerald-50 px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">For Indiana employers and Host Shops</p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Build your workforce with apprenticeship support</h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-700">It is free to apply to join Elevate’s Host Shop network. Approved employers can grow service capacity by hiring and training apprentices, developing future licensed talent, and earning revenue from the apprentice’s supervised work in accordance with wage, licensing, supervision, and program requirements.</p>
          <p className="mt-3 text-sm font-medium leading-6 text-slate-600">Eligible employers may also qualify for workforce reimbursement or training-cost support through WorkOne, WIOA, on-the-job training, or another workforce partner. Reimbursement is not automatic or guaranteed; the employer, apprentice, occupation, costs, and funding authorization must be approved by the responsible workforce agency before costs are incurred.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href="/partners/host-shops" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 font-black text-white hover:bg-emerald-800">Become a Host Shop — Free</a>
            <a href="/funding/wioa" className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-emerald-700 bg-white px-6 py-3 font-black text-emerald-800 hover:bg-emerald-50">Review workforce funding</a>
          </div>
        </div>
      </section>

        </div>
      </ProgramDetailPage>
    </>
  );
}

export async function generateMetadata() {
  return {
    title: 'Nail Technician Apprenticeship Program | Indiana | Elevate for Humanity',
    description:
      'Registered, competency-based Indiana nail technician and manicurist apprenticeship with 19 verified occupational competencies, 210 related-instruction hours, supervised host-site practice, and licensing preparation.',
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
