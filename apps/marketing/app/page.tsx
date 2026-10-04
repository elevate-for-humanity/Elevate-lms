import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays, ShieldCheck } from 'lucide-react';
import { HomeCareerPathways } from '@/components/home/HomeCareerPathways';
import { PlatformHubHero } from '@/components/home/PlatformHubHero';
import { HomeFeaturedHostShop } from '@/components/home/HomeFeaturedHostShop';
import { HomeNetworks } from '@/components/home/HomeNetworks';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StructuredData from '@/components/StructuredData';
import { WORKONE_INDY_BOOKING_URL } from '@/lib/workone/booking';

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships` },
  description: 'Explore career training, registered apprenticeships, and employer-connected learning. Find your program and take the next step.',
  alternates: { canonical: 'https://www.elevateforhumanity.org' },
  openGraph: {
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description: 'Career training, registered apprenticeships, testing, credentials, and employer connections.',
    url: 'https://www.elevateforhumanity.org',
    siteName: PLATFORM_DEFAULTS.orgName,
    locale: 'en_US',
    images: [{ url: '/images/partners/salon-saloon/team-interior.webp', alt: 'Salon Saloon, an Elevate apprenticeship Host Shop' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training & Apprenticeships`,
    description: 'Explore career training and employer-connected apprenticeship pathways.',
    images: ['/images/partners/salon-saloon/team-interior.webp'],
  },
  robots: { index: true, follow: true },
};

/** Keep the homepage focused. Detailed operations, pricing and program guides
 * remain on their own pages; do not rebuild a collage of unrelated imagery. */
export default function HomePage() {
  return (
    <>
      <StructuredData />
      <main data-homepage-design="focused-shops-v1" className="[&_a]:no-underline [&_a:hover]:no-underline">
        <PlatformHubHero />
        <section className="bg-white px-4 py-8 sm:py-12" aria-labelledby="home-heading">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-red-700">Elevate for Humanity</p>
              <h1 id="home-heading" className="mt-2 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">Build skills. Start your next chapter.</h1>
              <p className="mt-3 text-base leading-7 text-slate-700">Career training and apprenticeships connected to real workplaces.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
              <Link href="/programs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">Find a program <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/apply" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-950 hover:bg-slate-50">Start an application</Link>
            </div>
          </div>
        </section>
        <HomeFeaturedHostShop />
        <HomeCareerPathways />
        <section className="border-y border-slate-200 bg-slate-50 px-4 py-6" aria-labelledby="workone-home-cta">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <h2 id="workone-home-cta" className="text-xl font-bold text-slate-950">Need help with funding?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">CDL, HVAC, bookkeeping and business pathways may be free to those who qualify. WorkOne determines eligibility; funding requires written approval.</p>
            </div>
            <a href={WORKONE_INDY_BOOKING_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-center font-bold text-white hover:bg-slate-800"><CalendarDays className="h-5 w-5 shrink-0" aria-hidden="true" />Schedule WorkOne intake</a>
          </div>
        </section>
        <HomeNetworks />
        <section className="border-t border-slate-200 bg-white px-4 py-8" aria-labelledby="home-help-heading">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="home-help-heading" className="text-xl font-bold text-slate-950">Not sure where to start?</h2>
              <Link href="/contact" className="mt-2 inline-flex min-h-11 items-center gap-2 font-bold text-brand-red-700">Talk with admissions <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <Link href="/approvals" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-700"><ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />View registrations and approvals</Link>
          </div>
        </section>
      </main>
    </>
  );
}
