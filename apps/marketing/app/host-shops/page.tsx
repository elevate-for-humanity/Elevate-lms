import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, MapPin, Phone } from 'lucide-react';
import { listPublicHostShops } from '@/lib/partners/public-host-shops';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Indiana Barber Apprenticeship Host Shops | Elevate for Humanity',
  description:
    'Explore verified Elevate for Humanity apprenticeship host shops across Indiana and find participating barber apprenticeship worksites.',
  keywords: [
    'Indiana barber shops',
    'barber apprenticeship host shops',
    'barber apprenticeship Indiana',
    'barber shops hiring apprentices',
    'barber training shops Indiana',
  ],
  alternates: { canonical: 'https://www.elevateforhumanity.org/host-shops' },
};

function addressLine(shop: Awaited<ReturnType<typeof listPublicHostShops>>[number]) {
  return [shop.address_line1, shop.address_line2, shop.city, shop.state, shop.zip]
    .filter(Boolean)
    .join(', ');
}

export default async function HostShopDirectoryPage() {
  const shops = await listPublicHostShops();

  return (
    <main className="bg-white text-slate-950">
      <section className="border-b border-slate-200 bg-slate-950 px-4 py-14 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-red-300">Verified apprenticeship Host Shops</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Train with an approved local shop.</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Shops appear here automatically after Elevate&apos;s Host Shop verification workflow approves their required business, supervisor, insurance, workers&apos; compensation, and onboarding evidence.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          {shops.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <h2 className="text-2xl font-black">Host Shop profiles are being verified.</h2>
              <p className="mt-3 text-slate-700">Approved shops will publish here automatically when verification is complete.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => {
                const externalUrl = shop.website_url || shop.website;
                const media = shop.logo_url || shop.flyer_url;
                return (
                  <article key={shop.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {media ? (
                      <div className="relative aspect-[16/9] bg-slate-100">
                        <Image
                          src={media}
                          alt={`${shop.display_name} apprenticeship Host Shop`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className={shop.logo_url ? 'object-contain p-5' : 'object-cover'}
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col p-6">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-brand-red-700">
                        {[shop.city, shop.state].filter(Boolean).join(', ') || 'Approved Host Shop'}
                      </p>
                      <h2 className="mt-2 text-2xl font-black">{shop.display_name}</h2>
                      {addressLine(shop) ? (
                        <p className="mt-3 flex items-start gap-2 text-sm font-semibold text-slate-700">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red-700" />
                          {addressLine(shop)}
                        </p>
                      ) : null}
                      {shop.phone ? (
                        <a href={`tel:${shop.phone.replace(/[^0-9+]/g, '')}`} className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-800 hover:text-brand-red-700">
                          <Phone className="h-4 w-4 text-brand-red-700" /> {shop.phone}
                        </a>
                      ) : null}
                      <p className="mt-4 flex-1 text-sm leading-6 text-slate-700">
                        {shop.description || 'Approved apprenticeship Host Shop participating in supervised on-the-job learning.'}
                      </p>
                      <div className="mt-6 flex flex-wrap gap-2">
                        <Link href={`/host-shops/${shop.public_slug}`} className="rounded-xl bg-brand-red-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-brand-red-700">
                          Shop profile
                        </Link>
                        {externalUrl ? (
                          <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-extrabold hover:bg-slate-50">
                            Visit shop online <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-12 text-center sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black">Want to become a barber apprentice?</h2>
          <p className="mt-4 leading-7 text-slate-700">Apply through Elevate for Humanity and identify your Host Shop if you already have one.</p>
          <Link href="/programs/barber-apprenticeship/apply" className="mt-7 inline-flex rounded-xl bg-brand-red-600 px-6 py-3 font-extrabold text-white hover:bg-brand-red-700">
            Apply for Barber Apprenticeship
          </Link>
        </div>
      </section>
    </main>
  );
}
