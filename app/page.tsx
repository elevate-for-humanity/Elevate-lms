import { Suspense } from 'react';
import type { Metadata } from 'next';
import HomeHeroVideo from '@/components/ui/HomeHeroVideo';
import heroBanners from '@/content/heroBanners';
import { HomeFundingStrip } from '@/components/home/HomeFundingStrip';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeOutcomes } from '@/components/home/HomeOutcomes';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { Skeleton } from '@/components/ui/skeleton';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Revalidate every 5 minutes — allows live enrollment stats to refresh
// without a full rebuild.
export const revalidate = 300;

export const metadata: Metadata = {
  title: `${PLATFORM_DEFAULTS.orgName} | Workforce Training, Apprenticeships & Funding — Indianapolis`,
  description:
    'DOL-registered apprenticeship sponsor and WIOA-approved training provider. Funded training in healthcare, skilled trades, CDL, technology, and more — often at no cost. Apply today.',
  keywords: [
    'workforce training Indianapolis',
    'WIOA training Indiana',
    'DOL registered apprenticeship',
    'ETPL approved training provider',
    'funded career training Indiana',
    'apprenticeship programs Indianapolis',
    'HVAC training Indianapolis',
    'CNA training Indianapolis',
    'CDL training Indiana',
    'free job training Marion County',
    PLATFORM_DEFAULTS.orgName,
  ],
  alternates: {
    canonical: PLATFORM_DEFAULTS.siteUrl,
  },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Workforce Training, Apprenticeships & Funding`,
    description:
      'DOL-registered apprenticeship sponsor. Funded training in healthcare, skilled trades, CDL, and technology — often at no cost through WIOA or state funding.',
    url: PLATFORM_DEFAULTS.siteUrl,
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [
      {
        url: '/images/pages/comp-home-hero.webp',
        width: 1200,
        height: 630,
        alt: `${PLATFORM_DEFAULTS.orgName} workforce training`,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PLATFORM_DEFAULTS.orgName} | Workforce Training & Apprenticeships`,
    description:
      'Funded training, DOL-registered apprenticeships, and job placement — often at no cost.',
    images: ['/images/pages/comp-home-hero.webp'],
  },
};

// Skeleton for the async outcomes section while it streams in
function OutcomesSkeleton() {
  return (
    <div className="bg-slate-900 py-16 px-4" aria-hidden="true">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl bg-slate-800 border border-slate-700 p-5">
              <Skeleton className="h-10 w-20 mx-auto mb-2 bg-slate-700" />
              <Skeleton className="h-3 w-28 mx-auto bg-slate-700" />
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl bg-white border border-slate-200 p-6">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-2" />
              <Skeleton className="h-4 w-4/6 mb-6" />
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const banner = heroBanners.home;

  return (
    <>
      <HomeHeroVideo banner={banner} />
      <HomeFundingStrip />
      <HomeCareerPathways />
      <Suspense fallback={<OutcomesSkeleton />}>
        <HomeOutcomes />
      </Suspense>
      <HomeFinalCTA />
    </>
  );
}

