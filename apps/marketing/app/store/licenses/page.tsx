import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Code, Shield } from 'lucide-react';
import { STORE_PRODUCTS, CLONE_LICENSES } from '@/lib/data/store-products';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Platform Licenses | ${PLATFORM_DEFAULTS.orgName} Store`,
  description: `Review managed ${PLATFORM_DEFAULTS.orgName} platform license options and contact sales for implementation scope.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/licenses' },
};

function priceLabel(price: number, billingType: 'one_time' | 'subscription') {
  const amount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
  return billingType === 'subscription' ? `${amount}/month` : `Starting at ${amount}`;
}

export default function LicensesPage() {
  const licenseProducts = STORE_PRODUCTS.filter((p) => p.id.startsWith('efh-'));

  return (
    <div className="min-h-screen bg-white">
      <PictureFirstPageHero
        image="/images/pages/admin-licensing-hero.webp"
        alt="Workforce training platform licensing and administration"
        eyebrow="Managed Platform Licensing"
        title="License the Elevate Platform with implementation scoped to your organization"
        description="Platform and source-use licenses require sales review, implementation scope and deployment terms before purchase. Self-service SaaS plans remain available through Store plans."
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
            <h2 className="text-3xl font-black text-slate-950 md:text-4xl">Managed Platform License Options</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-700">Catalog amounts are starting points. Final scope, hosting, support, implementation and contract terms are confirmed before an invoice or payment link is issued.</p>
          </div>

          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-4">
            {licenseProducts.map((product) => (
              <article key={product.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div>
                  <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">Managed / Contract</div>
                  <h3 className="text-xl font-black text-slate-950">{product.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{product.description}</p>
                  <p className="mt-6 text-3xl font-black text-brand-blue-700">{priceLabel(product.price, product.billingType)}</p>
                </div>

                <div className="mt-6 flex-1 space-y-3">
                  {product.features.slice(0, 7).map((feature) => (
                    <p key={feature} className="flex items-start gap-2 text-sm text-slate-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-700" /> {feature}</p>
                  ))}
                </div>

                <Link href={`/contact?topic=platform-licensing&product=${encodeURIComponent(product.slug)}`} className="mt-7 inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-bold text-white hover:bg-slate-800">Request License Scope <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
              <p className="mx-auto mt-3 max-w-2xl text-slate-700">Source-use and self-host arrangements require license terms, deployment scope and security responsibilities to be agreed before purchase.</p>
            </div>
            <div className="grid gap-7 md:grid-cols-3">
              {CLONE_LICENSES.map((license) => (
                <article key={license.id} className="rounded-2xl border border-slate-200 bg-white p-7">
                  <div className="mb-3 inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-purple-800">Contact Sales</div>
                  <h3 className="text-xl font-black text-slate-950">{license.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{license.description}</p>
                  <p className="mt-5 text-3xl font-black text-purple-700">{priceLabel(license.price, license.billingType)}</p>
                  <div className="mt-6 space-y-3">
                    {license.features.slice(0, 6).map((feature) => (
                      <p key={feature} className="flex items-start gap-2 text-sm text-slate-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-700" /> {feature}</p>
                    ))}
                  </div>
                  <Link href={`/contact?topic=source-license&product=${encodeURIComponent(license.slug)}`} className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-purple-700 px-6 py-3 font-bold text-white hover:bg-purple-800">Request License Scope</Link>
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
                <h2 className="text-2xl font-black text-slate-950">Why these licenses are managed</h2>
                <p className="mt-3 leading-7 text-slate-700">Enterprise deployment, source access, security responsibilities, hosting, integrations, support and service commitments must be defined in an agreement. The Store does not treat those obligations as an instant self-service checkout.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black">Need help choosing a license?</h2>
          <p className="mt-4 text-lg text-slate-300">Contact Elevate to determine the right platform scope, or use the self-service Store plans if you only need hosted SaaS access.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/contact?topic=platform-licensing" className="rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white hover:bg-brand-red-700">Contact Sales</Link>
            <Link href="/store/plans" className="rounded-xl border border-slate-600 px-8 py-4 font-bold text-white hover:bg-slate-800">Self-Service Plans</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
