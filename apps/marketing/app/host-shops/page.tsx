import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, MapPin, Phone } from 'lucide-react';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';

export const metadata: Metadata = {
  title: 'Indiana Barber Apprenticeship Host Shops | Elevate for Humanity',
  description:
    'Explore Elevate for Humanity apprenticeship host shops across Indiana. Find shop profiles, addresses, phone numbers, maps, websites, booking links, and barber apprenticeship opportunities.',
  keywords: [
    'Indiana barber shops',
    'barber apprenticeship host shops',
    'barber apprenticeship Indiana',
    'barber shops hiring apprentices',
    'barber training shops Indiana',
  ],
  alternates: { canonical: 'https://www.elevateforhumanity.org/host-shops' },
};

export default function HostShopDirectoryPage() {
  return (
    <main className="bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-red-300">Indiana host-shop directory</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Support local shops. Explore apprenticeship opportunities.</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Elevate’s host-shop network connects future barbers with working Indiana shops while helping customers discover and support the local businesses participating in apprenticeship training.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURED_BEAUTY_HOST_PARTNERS.map((shop) => {
              const publicName = shop.dba ?? shop.name;
              const externalUrl = shop.websiteUrl ?? shop.onlineListingUrl ?? shop.socialUrl;
              const externalLabel = shop.websiteLabel ?? shop.onlineListingLabel ?? shop.socialLabel ?? 'Visit shop online';
              return (
                <article key={shop.slug} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-brand-red-700">{shop.city}, Indiana</p>
                  <h2 className="mt-2 text-2xl font-black">{publicName}</h2>
                  <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-slate-700">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red-700" />
                    {shop.address}, {shop.city}, {shop.state} {shop.zip}
                  </p>
                  {shop.phone ? (
                    <a href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`} className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-800 hover:text-brand-red-700">
                      <Phone className="h-4 w-4 text-brand-red-700" /> {shop.phone}
                    </a>
                  ) : null}
                  <p className="mt-4 flex-1 text-sm leading-6 text-slate-700">{shop.marketingBlurb ?? shop.note}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Link href={`/host-shops/${shop.slug}`} className="rounded-xl bg-brand-red-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-brand-red-700">
                      Shop profile
                    </Link>
                    {externalUrl ? (
                      <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold hover:bg-slate-50">
                        {externalLabel} <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-12 text-center sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black">Want to become a barber apprentice?</h2>
          <p className="mt-4 leading-7 text-slate-700">Apply through Elevate for Humanity. Host-shop availability is reviewed during enrollment and placement.</p>
          <Link href="/programs/barber-apprenticeship/apply" className="mt-7 inline-flex rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white hover:bg-brand-red-700">
            Apply for Barber Apprenticeship
          </Link>
        </div>
      </section>
    </main>
  );
}
