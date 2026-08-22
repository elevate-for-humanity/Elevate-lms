'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Plus, ArrowRight } from 'lucide-react';
import { ADD_ON_MARKETPLACE } from '@/lib/store/platform-pricing';

interface Props {
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
}

const PUBLIC_SUBSCRIPTION_ADDONS = ADD_ON_MARKETPLACE.filter(
  (addon) => !addon.hiddenFromMarketplace,
);

export function AddOnMarketplaceSection({ selectedSlugs, onToggle }: Props) {
  return (
    <section className="py-16 px-4 bg-slate-50" id="subscription-addons">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">Subscription Add-Ons</h2>
        <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
          Monthly modules you can add to your base plan. Start with the capabilities your organization needs, then expand without creating another disconnected system.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PUBLIC_SUBSCRIPTION_ADDONS.map((addon) => {
            const selected = selectedSlugs.includes(addon.slug);
            return (
              <div
                key={addon.slug}
                className={`rounded-xl border p-6 flex flex-col bg-white ${
                  selected ? 'border-brand-blue-500 ring-2 ring-brand-blue-200' : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-slate-900">{addon.name}</h3>
                  <span className="text-lg font-bold text-brand-blue-600 whitespace-nowrap">
                    ${addon.priceMonthly}/mo
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{addon.description}</p>
                {addon.usageNote && (
                  <p className="text-xs text-slate-500 mb-3">{addon.usageNote}</p>
                )}
                <ul className="space-y-2 mb-6 flex-1">
                  {addon.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onToggle(addon.slug)}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${
                    selected
                      ? 'bg-brand-blue-600 text-white'
                      : 'border border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  {selected ? 'Included at checkout' : 'Add to checkout'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <h3 className="text-xl font-bold text-slate-900">Need a managed or custom implementation?</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Enterprise deployments, custom integrations and source-use licensing are scoped separately instead of being sold as unsupported lifetime add-ons.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/store/licenses"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50"
            >
              Enterprise licensing <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact?subject=Managed%20Platform%20Services"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
            >
              Contact Sales <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Self-contained marketplace with local selection state */
export function AddOnMarketplaceStandalone({
  initialSlugs = [],
  onSelectionChange,
}: {
  initialSlugs?: string[];
  onSelectionChange?: (slugs: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initialSlugs);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      onSelectionChange?.(next);
      return next;
    });
  };

  return <AddOnMarketplaceSection selectedSlugs={selected} onToggle={toggle} />;
}
