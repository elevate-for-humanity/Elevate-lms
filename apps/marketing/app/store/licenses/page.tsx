import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Code, Shield } from 'lucide-react';
import { STORE_PRODUCTS, CLONE_LICENSES } from '@/lib/data/store-products';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Platform Licenses | ${PLATFORM_DEFAULTS.orgName} Store`,
  description: `Review current ${PLATFORM_DEFAULTS.orgName} platform license options using the canonical store catalog.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/licenses' },
};

function priceLabel(price: number, billingType: 'one_time' | 'subscription') {
  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  return billingType === 'subscription' ? `${amount}/month` : amount;
}

export default function LicensesPage() {
  const licenseProducts = STORE_PRODUCTS.filter((p) => p.id.startsWith('efh-'));

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/store-licensing-enterprise-hero.webp"
        alt="Workforce training platform licensing and administration"
        eyebrow="Platform Licensing"
        title="License the Elevate Platform"
        description="Current license names, prices, billing types, included apps, and features are loaded from the canonical store catalog—without a dark hero overlay or separate marketing price table."
        actions={(
          <>
            <Link href="#pricing" className="inline-flex items-center rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white hover:bg-brand-red-700">View License Options</Link>
            <Link href="/contact?topic=platform-licensing" className="inline-flex items-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 font-bold text-slate-900 hover:border-slate-500">Talk to Sales</Link>
          </>
        )}
      />

      <section id="pricing" className="bg-slate-50 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black text-slate-950 md:text-4xl">Platform License Options</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-700">Pricing below comes directly from the same catalog used by license checkout.</p>
          </div>

          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-4">
            {licenseProducts.map((product) => (
              <article key={product.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div>
                  <h3 className="text-xl font-black text-slate-950">{product.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{product.description}</p>
                  <p className="mt-6 text-3xl font-black text-brand-blue-700">{priceLabel(product.price, product.billingType)}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{product.billingType === 'subscription' ? 'Recurring billing' : 'One-time license'}</p>
                </div>

                <div className="mt-6 flex-1 space-y-3">
                  {product.features.slice(0, 7).map((feature) => (
                    <p key={feature} className="flex items-start gap-2 text-sm text-slate-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-700" /> {feature}</p>
                  ))}
                </div>

                <Link href={`/store/licenses/checkout/${product.slug}`} className="mt-7 inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-bold text-white hover:bg-slate-800">Continue to License Checkout <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {CLONE_LICENSES.length > 0 ? (
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <Code className="mx-auto mb-4 h-9 w-9 text-purple-700" />
              <h2 className="text-3xl font-black text-slate-950">Developer / Self-Host Licenses</h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-700">These options are also loaded from the canonical license catalog.</p>
            </div>
            <div className="grid gap-7 md:grid-cols-3">
              {CLONE_LICENSES.map((license) => (
                <article key={license.id} className="rounded-2xl border border-slate-200 bg-white p-7">
                  <h3 className="text-xl font-black text-slate-950">{license.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{license.description}</p>
                  <p className="mt-5 text-3xl font-black text-purple-700">{priceLabel(license.price, license.billingType)}</p>
                  <div className="mt-6 space-y-3">
                    {license.features.slice(0, 6).map((feature) => (
                      <p key={feature} className="flex items-start gap-2 text-sm text-slate-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-700" /> {feature}</p>
                    ))}
                  </div>
                  <Link href={`/store/licenses/checkout/${license.slug}`} className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-purple-700 px-6 py-3 font-bold text-white hover:bg-purple-800">Continue to Checkout</Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-y border-slate-200 bg-slate-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="flex items-start gap-4">
              <Shield className="mt-1 h-8 w-8 shrink-0 text-brand-blue-700" />
              <div>
                <h2 className="text-2xl font-black text-slate-950">Before purchasing</h2>
                <p className="mt-3 leading-7 text-slate-700">Review the exact license, included applications, billing type, and checkout terms. Product availability and implementation scope are determined by the selected catalog item—not by old deployment-count, uptime, or support claims on this page.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black">Need help choosing a license?</h2>
          <p className="mt-4 text-lg text-slate-300">Contact Elevate before checkout if you need help determining which platform option matches your organization.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/contact?topic=platform-licensing" className="rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white hover:bg-brand-red-700">Contact Sales</Link>
            <Link href="/store" className="rounded-xl border border-slate-600 px-8 py-4 font-bold text-white hover:bg-slate-800">Back to Store</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
