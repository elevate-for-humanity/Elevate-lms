import { ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';
import { CAPABILITY_CATALOG } from '@/lib/platform/capability-catalog';
import type { PlatformFeatureKey } from '@/lib/platform/features';

const STORE_ORIGIN = 'https://www.elevateforhumanity.org';

export function CapabilityUpgradeGrid({ ownedFeatures }: { ownedFeatures: string[] }) {
  const owned = new Set(ownedFeatures);
  const items = CAPABILITY_CATALOG.filter((capability) => capability.status !== 'internal');

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">Your platform capabilities</h2>
          <p className="mt-1 text-sm text-slate-600">Owned features stay available here. Add the next capability from the Store when you need it.</p>
        </div>
        <a href={`${STORE_ORIGIN}/store#marketplace`} className="inline-flex items-center gap-2 text-sm font-black text-brand-red-700 hover:underline">
          Open Store <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((capability) => {
          const hasFeature = owned.has(capability.key as PlatformFeatureKey);
          const href = capability.storeHref || capability.marketingHref || '/store#marketplace';
          return (
            <article key={capability.key} className={`rounded-2xl border p-5 ${hasFeature ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-950">{capability.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{capability.description}</p>
                </div>
                {hasFeature ? <CheckCircle2 className="h-5 w-5 flex-none text-emerald-600" /> : <LockKeyhole className="h-5 w-5 flex-none text-slate-400" />}
              </div>
              <div className="mt-4">
                {hasFeature ? (
                  <span className="text-sm font-black text-emerald-700">Included / Active</span>
                ) : (
                  <a href={`${STORE_ORIGIN}${href}`} className="inline-flex items-center gap-1 text-sm font-black text-brand-red-700 hover:underline">
                    View upgrade <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
