// Homepage sections are intentionally ordered from visual proof to pathways to action.
// Funding/payment sales content belongs on funding and program pages, not the homepage.
import type { Metadata } from 'next';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { PlatformHubHero } from '@/components/home/PlatformHubHero';
import { HomeFeaturedHostShop } from '@/components/home/HomeFeaturedHostShop';
import { HomePlatformOverview } from '@/components/home/HomePlatformOverview';
import { HomeNetworks } from '@/components/home/HomeNetworks';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StructuredData from '@/components/StructuredData';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `${PLATFORM_DEFAULTS.orgName} | Workforce Training & Apprenticeship Platform` },
  description: 'Career training, registered apprenticeships, employer coordination, credentials, compliance, and participant progress.',
  alternates: { canonical: 'https://www.elevateforhumanity.org' },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description: 'Career training, registered apprenticeships, testing, credentials, employer connections, and workforce technology.',
    url: 'https://www.elevateforhumanity.org',
    siteName: PLATFORM_DEFAULTS.orgName,
    locale: 'en_US',
    images: [{ url: '/images/pages/comp-home-hero.webp', width: 1200, height: 630, alt: `${PLATFORM_DEFAULTS.orgName} career training and workforce programs` }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description: 'Explore career training, registered apprenticeships, Host Shops, and employer-connected pathways across Indiana.',
    images: ['/images/pages/comp-home-hero.webp'],
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <main className="[&_a]:no-underline [&_a:hover]:no-underline">
        <section className="border-b border-amber-300 bg-amber-50 px-4 py-5" aria-labelledby="workone-home-cta">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-900">Funding intake</p>
              <h2 id="workone-home-cta" className="mt-1 text-xl font-black text-slate-950 sm:text-2xl">Interested in possible funding for CDL, bookkeeping, business or HVAC training?</h2>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-700">Schedule your WorkOne intake appointment to begin the eligibility process. Funding is based on individual eligibility and program requirements.</p>
            </div>
            <a
              href={WORKONE_INDY_BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-center font-black text-white hover:bg-slate-800"
            >
              Schedule WorkOne Appointment
            </a>
          </div>
        </section>
        <PlatformHubHero />
        <HomeFeaturedHostShop />
        <HomeNetworks />
        <HomeCareerPathways />
        <HomePlatformOverview />
        <HomeFinalCTA />
        <HomeTrustBar />
      </main>
    </>
  );
}
