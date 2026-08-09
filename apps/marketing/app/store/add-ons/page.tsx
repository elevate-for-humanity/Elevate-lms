import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { COMMUNITY_ADDONS } from '@/lib/data/store-products';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const dynamic = 'force-static';

const addOnImages: Record<string, string> = {
  'community-hub': '/images/pages/community-page-4.webp',
  'community-basic': '/images/pages/store-hero.webp',
  'community-pro': '/images/pages/wioa-meeting.webp',
  'community-enterprise': '/images/pages/admin-compliance-hero.webp',
};

function priceLabel(price: number, billingType: 'one_time' | 'subscription') {
  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  return billingType === 'subscription' ? `${amount}/month` : amount;
}

export default function AddOnsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Add-Ons' }]} />
        </div>
      </div>

      <PictureFirstPageHero
        image="/images/pages/pathways-page-2.webp"
        alt="Platform extensions and community tools"
        eyebrow="Platform Add-Ons"
        title="Extend the Platform with Canonical Add-Ons"
        description="Add-on names, pricing, billing type, and included features now come from the same platform catalog used by the rest of the store."
        actions={(
          <>
            <Link href="#add-ons" className="inline-flex items-center rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white hover:bg-brand-red-700">View Add-Ons</Link>
            <Link href="/pricing" className="inline-flex items-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 font-bold text-slate-900 hover:border-slate-500">Platform Pricing</Link>
          </>
        )}
      />

      <section id="add-ons" className="bg-slate-50 px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black text-slate-950">Available Add-Ons</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-700">No duplicate hard-coded price table and no fabricated performance percentages.</p>
          </div>

          <div className="grid gap-7 md:grid-cols-2">
            {COMMUNITY_ADDONS.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="relative aspect-[16/8] w-full overflow-hidden bg-slate-100">
                  <Image
                    src={addOnImages[product.id] || '/images/pages/comp-home-pathways-support.webp'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-7">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-950">{product.name}</h3>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-700">{product.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-brand-blue-700">{priceLabel(product.price, product.billingType)}</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{product.billingType === 'subscription' ? 'Recurring' : 'One-time'}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {product.features.slice(0, 6).map((feature) => (
                      <p key={feature} className="flex items-start gap-2 text-sm text-slate-800"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-700" /> {feature}</p>
                    ))}
                  </div>

                  <div className="mt-7 flex flex-wrap gap-3">
                    {product.id === 'community-hub' ? (
                      <Link href="/store/add-ons/community-hub" className="inline-flex items-center rounded-lg bg-brand-blue-700 px-5 py-3 font-bold text-white hover:bg-brand-blue-800">View Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    ) : (
                      <Link href={`/contact?product=${encodeURIComponent(product.slug)}`} className="inline-flex items-center rounded-lg bg-brand-blue-700 px-5 py-3 font-bold text-white hover:bg-brand-blue-800">Ask About This Add-On <ArrowRight className="ml-2 h-4 w-4" /></Link>
                    )}
                    <Link href="/pricing" className="inline-flex items-center rounded-lg border border-slate-300 px-5 py-3 font-bold text-slate-800 hover:bg-slate-50">Pricing & Licensing</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black">Need a different platform capability?</h2>
          <p className="mt-4 text-lg text-slate-300">Use the main Store for current products, licensing, and platform capabilities.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/store" className="rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white hover:bg-brand-red-700">Back to Store</Link>
            <Link href="/contact" className="rounded-xl border border-slate-600 px-8 py-4 font-bold text-white hover:bg-slate-800">Contact Sales</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
