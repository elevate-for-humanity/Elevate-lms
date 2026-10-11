// Keep the homepage focused on training, the featured shops, and enrollment.
// Detailed platform operations remain on the dedicated platform pages.
import type { Metadata } from 'next';
import Link from 'next/link';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { HomeFinalCTA } from '@/components/home/HomeFinalCTA';
import { PlatformHubHero } from '@/components/home/PlatformHubHero';
import { HomeFeaturedHostShop } from '@/components/home/HomeFeaturedHostShop';
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
    images: [{ url: 'https://www.elevateforhumanity.org/images/partners/salon-saloon/team-sign.webp', alt: `${PLATFORM_DEFAULTS.orgName} career training and workforce programs` }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description: 'Explore career training, registered apprenticeships, Host Shops, and employer-connected pathways across Indiana.',
    images: ['https://www.elevateforhumanity.org/images/partners/salon-saloon/team-sign.webp'],
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <main data-homepage-curation="20261004" className="[&_a]:no-underline [&_a:hover]:no-underline">
        <h1 className="sr-only">Elevate for Humanity career training and apprenticeships</h1>
        <PlatformHubHero />
        <HomeFeaturedHostShop />
        <HomeCareerPathways />
        <section className="bg-slate-50 px-5 py-12" aria-labelledby="tax-home-cta">
          <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-8">
            <p className="text-sm font-semibold text-sky-800">Supersonic Fast Cash · PARIS</p>
            <h2 id="tax-home-cta" className="mt-3 text-3xl font-bold text-slate-950">Explore our tax preparation software</h2>
            <p className="mt-4 max-w-2xl text-slate-600">Start a return, organize your interview answers, and review confirmed W-2 information in your secure workspace.</p>
            <Link href="/tax" className="mt-6 inline-flex rounded-xl bg-sky-800 px-6 py-3 font-semibold text-white">Open PARIS tax software</Link>
          </div>
        </section>
        <section className="border-y border-slate-200 bg-slate-50 px-4 py-6" aria-labelledby="workone-home-cta">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="workone-home-cta" className="text-xl font-bold text-slate-950">Explore training funding</h2>
              <p className="mt-2 max-w-2xl text-base leading-6 text-slate-700">CDL, bookkeeping, business and HVAC. Free to those who qualify; eligibility and program requirements apply.</p>
            </div>
            <a href={WORKONE_INDY_BOOKING_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-center text-sm font-bold text-white hover:bg-slate-800">
              Schedule WorkOne Appointment
            </a>
          </div>
        </section>
        <HomeFinalCTA />
      </main>
    </>
  );
}
