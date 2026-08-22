import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, CheckCircle } from 'lucide-react';
import PictureFirstPageHero from '@/components/site/PictureFirstPageHero';
import { ADD_ON_MARKETPLACE } from '@/lib/store/platform-pricing';

export const dynamic = 'force-static';

const PUBLIC_ADDONS = ADD_ON_MARKETPLACE.filter((addon) => !addon.hiddenFromMarketplace);

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
        alt="Platform extensions and connected business tools"
        eyebrow="Platform Add-Ons"
        title="Add capabilities without adding another disconnected system"
        description="These are the same canonical subscription add-ons used by Store checkout and platform entitlement provisioning."
        actions={(
          <>
            <Link href="#add-ons" className="inline-flex items-center rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white hover:bg-brand-red-700">View Add-Ons</Link>
            <Link href="/store/plans" className="inline-flex items-center rounded-xl border-2 border-slate-300 bg-white px-8 py-4 font-bold text-slate-900 hover:border-slate-500">Compare Plans</Link>
          </>
        )}
      />

      <section id="add-ons" className="bg-slate-50 px-4 py-16 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black text-slate-950">Available Subscription Add-Ons</h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-700">One public catalog controls the product name, monthly price and entitlement bundle. Retired compatibility SKUs are not offered for new purchase.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PUBLIC_ADDONS.map((addon) => (
              <article key={addon.slug} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">{addon.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{addon.description}</p>
                  </div>
                  <p className="shrink-0 text-xl font-black text-brand-blue-700">${addon.priceMonthly}/mo</p>
                </div>

                {addon.usageNote ? <p className="mt-3 text-xs font-semibold text-slate-500">{addon.usageNote}</p> : null}

                <div className="mt-5 flex-1 space-y-2">
                  {addon.bullets.map((feature) => (
                    <p key={feature} className="flex items-start gap-2 text-sm text-slate-800">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-700" />
                      {feature}
                    </p>
                  ))}
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  {addon.slug === 'community-hub' ? (
                    <Link href="/store/add-ons/community-hub" className="inline-flex items-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50">View Details</Link>
                  ) : null}
                  <Link href={`/store/plans?addon=${encodeURIComponent(addon.slug)}`} className="inline-flex items-center rounded-lg bg-brand-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-blue-800">
                    Add to a Plan <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black">Need enterprise implementation or custom platform work?</h2>
          <p className="mt-4 text-lg text-slate-300">Managed deployment, custom integrations and source-use licensing are scoped separately from self-service subscriptions.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/store/licenses" className="rounded-xl bg-brand-red-600 px-8 py-4 font-bold text-white hover:bg-brand-red-700">Enterprise Licensing</Link>
            <Link href="/contact?subject=Managed%20Platform%20Services" className="rounded-xl border border-slate-600 px-8 py-4 font-bold text-white hover:bg-slate-800">Contact Sales</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
