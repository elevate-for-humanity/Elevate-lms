import { Suspense } from 'react';
import type { Metadata } from 'next';
import HomeHeroVideo from '@/components/ui/HomeHeroVideo';
import heroBanners from '@/content/heroBanners';
import MarqueeBanner from '@/components/MarqueeBanner';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { HomeHowItWorks } from '@/components/home/HomeHowItWorks';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeApprenticeshipInfra } from '@/components/home/HomeApprenticeshipInfra';
import { HomeFunding } from '@/components/home/HomeFunding';
import { HomeOutcomes } from '@/components/home/HomeOutcomes';
import { HomeEmployerStrip } from '@/components/home/HomeEmployerStrip';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { Skeleton } from '@/components/ui/Skeleton';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ParisFloatingButton } from '@/components/paris/ParisFloatingButton';

// Revalidate every 5 minutes.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `${PLATFORM_DEFAULTS.orgName} | Workforce Training, Apprenticeships & Career Programs — Indianapolis` },
  description:
    'DOL-registered apprenticeship sponsor and Indiana ETPL-listed training provider. Career training programs in healthcare, skilled trades, CDL, technology, and beauty — funding options may be available.',
  keywords: [
    'workforce training Indianapolis',
    'Indiana workforce training',
    'DOL registered apprenticeship',
    'Indiana ETPL training provider',
    'career training Indiana',
    'apprenticeship programs Indianapolis',
    'HVAC training Indianapolis',
    'CNA training Indianapolis',
    'CDL training Indiana',
    'affordable career training Marion County',
    PLATFORM_DEFAULTS.orgName,
  ],
  alternates: {
    canonical: PLATFORM_DEFAULTS.siteUrl,
  },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Workforce Training, Apprenticeships & Career Programs`,
    description:
      'DOL-registered apprenticeship sponsor and Indiana ETPL-listed training provider. Career programs in healthcare, skilled trades, CDL, technology, and beauty — funding options may be available.',
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
      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <HomeHeroVideo banner={banner} />

      {/* ── 1b. ROTATING MARQUEE BANNER ─────────────────────────────────── */}
      <MarqueeBanner />

      {/* ── 2. CAREER CATEGORIES ────────────────────────────────────────── */}
      <HomeCareerPathways />

      {/* ── 3. HOW IT WORKS ───────────────────────────────────────────── */}
      <HomeHowItWorks />

      {/* ── 4. FUNDING ─────────────────────────────────────────────────── */}
      <HomeFunding />

      {/* ── 5. WHY ELEVATE ────────────────────────────────────────────── */}
      <HomeApprenticeshipInfra />

      {/* ── 6. SUCCESS STORIES + OUTCOMES ─────────────────────────────── */}
      <Suspense fallback={<OutcomesSkeleton />}>
        <HomeOutcomes />
      </Suspense>

      {/* ── 7. EMPLOYER CTA ───────────────────────────────────────────── */}
      <HomeEmployerStrip />

      {/* ── 8. TRUST + FINAL CTA ───────────────────────────────────────── */}
      <HomeTrustBar />
      <HomeFinalCTA />

      {/* ── PARIS AI Assistant ─────────────────────────────────────────── */}
      <ParisFloatingButton />
    </>
  );
}

// Build trigger Mon Jul 20 23:50:07 UTC 2026
// Build trigger Tue Jul 21 00:44:34 UTC 2026
