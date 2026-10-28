import HostShopBenefits from '@/components/partners/HostShopBenefits';
import HostShopNetworkDirectory from '@/components/partners/HostShopNetworkDirectory';
import { getHostShopNetwork, type HostShopNetworkEntry } from '@/lib/programs/host-shop-network';
import { logger } from '@/lib/logger';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { SafeHeroVideo } from '@/components/hero/SafeHeroVideo';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';
import { ArrowRight, BriefcaseBusiness, MessageCircle, Scissors, Users } from 'lucide-react';

export const metadata: Metadata = {
  manifest: '/manifest-barber-beauty.json',
  title: 'Barber & Beauty Network | Elevate for Humanity',
  description:
    'Find Indiana barbershops and salons, explore real portfolios, and contact or book directly. Licensed shops join free to showcase their business and develop apprentices. Earn while you learn through approved paid employment.',
  openGraph: {
    images: [
      {
        url: '/images/partners/kountry-kutz/interior-active-enhanced-2026.webp',
        alt: 'Inside an Elevate barber apprenticeship host shop',
      },
    ],
  },
  alternates: { canonical: 'https://www.elevateforhumanity.org/barber-beauty-network' },
};

const pathways = [
  {
    title: 'Community & Professional Groups',
    description:
      'Connect with other learners and industry professionals through the authenticated Elevate community. Sign-in may be required.',
    href: 'https://app.elevateforhumanity.org/community',
    action: 'Open member community',
    icon: MessageCircle,
  },
  {
    title: 'Barber & Beauty Directory',
    description:
      'Explore participating host shops, salons, barbershops, nail studios and esthetics businesses.',
    href: '/partners/host-shops',
    action: 'Explore directory',
    icon: Scissors,
  },
  {
    title: 'Jobs & Opportunities',
    description:
      'Browse available employer job postings across the Elevate network. Listings depend on approved employers.',
    href: '/jobs',
    action: 'Find opportunities',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Employers & Host Shops',
    description:
      'Connect your business to apprentices and talent, apply to host apprentices, and access employer hiring tools.',
    href: '/partners/host-shop/apply',
    action: 'Join as a host shop',
    icon: Users,
  },
] as const;

export const dynamic = 'force-dynamic';

export default async function BarberBeautyNetworkPage() {
  let shops: HostShopNetworkEntry[] = [];
  let directoryUnavailable = false;
  try {
    shops = await getHostShopNetwork();
  } catch (error) {
    logger.error('[BarberBeautyNetworkPage] Host Shop directory unavailable', error);
    directoryUnavailable = true;
  }
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="relative aspect-video">
          <SafeHeroVideo
            src="/videos/partners/kountry-kutz/shop-tour.mp4"
            poster="/images/partners/kountry-kutz/interior-active-enhanced-2026.webp"
            priority
            loop
            ariaLabel="A tour of participating Host Shop Kountry Kutz"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <p className="text-sm font-black uppercase tracking-[.16em] text-blue-200">
            Elevate Professional Network
          </p>
          <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">
            Barber & Beauty Network
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-100">
            A professional community for barbers, cosmetologists, estheticians, nail technicians,
            students, host shops and hiring businesses. Build connections, find opportunities and
            showcase the beauty industry.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="https://app.elevateforhumanity.org/signup"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-red-700 px-6 py-3 font-bold text-white hover:bg-red-600"
            >
              Join the Barber &amp; Beauty Network <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/partners/host-shop/apply"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/60 px-6 py-3 font-bold text-white hover:bg-white/10"
            >
              Apply as a Host Shop <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#shop-directory"
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/60 px-6 py-3 font-bold text-white hover:bg-white/10"
            >
              Find a Shop <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <HostShopBenefits />
      <section id="shop-directory" className="bg-slate-950 px-5 py-10 text-white sm:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black">Discover local shops. Support local talent.</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            Browse portfolios, choose a shop, and use its directions, contact, or booking links.
            Contact the shop to confirm hours and walk-in availability.
          </p>
          {directoryUnavailable ? (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-slate-950"
            >
              <h3 className="font-bold">The shop directory is temporarily unavailable.</h3>
              <p className="mt-2">
                We could not load the current approved shop records. Please try again later or
                contact admissions for help finding a Host Shop.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-flex min-h-11 items-center font-bold text-brand-blue-800 underline"
              >
                Contact admissions
              </Link>
            </div>
          ) : (
            <HostShopNetworkDirectory shops={shops} />
          )}
        </div>
      </section>
      <section id="join" className="bg-red-50 px-5 py-10 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-2 lg:items-center">
          <HostShopMediaCarousel
            shopName="Elevate Barber & Beauty Network"
            items={[
              {
                url: '/images/partners/top-shelf-barber-lounge/top-shelf-fade-profile-enhanced-2026.webp',
                alt: 'Top Shelf Barber Lounge haircut portfolio',
              },
              {
                url: '/images/partners/generations-hair/dimensional-color-after-enhanced-2026.webp',
                alt: 'Generations hair styling portfolio',
              },
              {
                url: '/images/partners/salon-saloon/team-interior-enhanced-2026.webp',
                alt: 'Salon Saloon team',
              },
            ]}
          />
          <div>
            <p className="text-sm font-black uppercase text-red-700">Free network membership</p>
            <h2 className="mt-2 text-3xl font-black">Your talent deserves to be seen.</h2>
            <p className="mt-4 leading-7">
              The Barber &amp; Beauty Network brings professionals, customers, students, and
              apprenticeship host shops together. Explore real portfolios, follow business links,
              share your work in the community, and find your next step.
            </p>
            <div className="mt-5 grid gap-3">
              <Link
                href="https://app.elevateforhumanity.org/signup"
                className="rounded-xl bg-red-700 px-5 py-3 text-center font-black text-white"
              >
                Join the Barber &amp; Beauty Network — Create Account
              </Link>
              <Link
                href="/partners/host-shop/apply"
                className="rounded-xl border border-red-700 bg-white px-5 py-3 text-center font-black"
              >
                Businesses: Apply as a Host Shop
              </Link>
              <Link
                href="https://app.elevateforhumanity.org/community"
                className="rounded-xl border border-red-700 bg-white px-5 py-3 text-center font-black"
              >
                Professionals &amp; Students: Join the Community
              </Link>
              <Link
                href="/programs/barber-apprenticeship"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center font-black"
              >
                Start Barber Training — Explore Payment Plans
              </Link>
            </div>
            <p className="mt-4 text-sm leading-6">
              Host shops apply at no cost and submit their business and supervisor documents for
              review. Approved shops receive portal access to add their portfolio and business
              links. Community access requires sign-in. Apprentice placement depends on approval and
              availability.
            </p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Connect, learn and grow</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-700">
          Choose where you want to go. Community conversations require a member account; directory
          listings and job opportunities are shown separately.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {pathways.map(({ title, description, href, action, icon: Icon }, index) => (
            <article
              key={title}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
            >
              <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  src={
                    [
                      '/images/partners/generations-hair/dimensional-color-after-enhanced-2026.webp',
                      '/images/partners/top-shelf-barber-lounge/top-shelf-fade-profile-enhanced-2026.webp',
                      '/images/partners/kountry-kutz/interior-empty-enhanced-2026.webp',
                      '/images/partners/salon-saloon/team-interior-enhanced-2026.webp',
                    ][index]
                  }
                  alt={title}
                  className="object-cover"
                  loading="lazy"
                />
              </div>
              <Icon aria-hidden="true" className="h-8 w-8 text-blue-700" />
              <h3 className="mt-4 text-2xl font-bold">{title}</h3>
              <p className="mt-3 leading-7 text-slate-700">{description}</p>
              <Link
                href={href}
                className="mt-auto inline-flex min-h-11 items-center gap-2 pt-5 font-bold text-red-700"
              >
                {action} <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/employers/post-job"
            className="font-bold text-blue-700 underline underline-offset-4"
          >
            Post a job
          </Link>
          <Link
            href="/employers/directory"
            className="font-bold text-blue-700 underline underline-offset-4"
          >
            Employer directory
          </Link>
          <Link
            href="/barber-and-beauty-apprenticeships"
            className="font-bold text-blue-700 underline underline-offset-4"
          >
            Beauty apprenticeships
          </Link>
        </div>
      </section>
      <section className="bg-slate-950 px-5 py-12 text-white sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-black">Find your place in the industry</h2>
          <div className="mt-7 grid gap-5 sm:grid-cols-3">
            {[
              [
                '01',
                'Explore',
                'Browse real shop portfolios and choose your training or professional pathway.',
              ],
              [
                '02',
                'Connect',
                'Apply to train, join the member community, or introduce your licensed business.',
              ],
              [
                '03',
                'Grow',
                'Build skills and relationships. Elevate confirms training and placement requirements with you.',
              ],
            ].map(([step, title, description]) => (
              <article key={step} className="rounded-2xl border border-white/20 p-6">
                <p className="text-3xl font-black text-amber-300">{step}</p>
                <h3 className="mt-3 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-6 text-slate-200">{description}</p>
              </article>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/barber-and-beauty-apprenticeships"
              className="rounded-xl bg-amber-300 px-6 py-3 font-bold text-slate-950"
            >
              Choose your training pathway
            </Link>
            <Link
              href="/partners/host-shop/apply"
              className="rounded-xl border border-white px-6 py-3 font-bold"
            >
              Bring your shop to the network
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
