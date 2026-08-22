'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ADD_ON_MARKETPLACE } from '@/lib/store/platform-pricing';
import { PlatformBasePlansSection } from '@/components/store/PlatformBasePlansSection';
import { AddOnMarketplaceSection } from '@/components/store/AddOnMarketplaceSection';

export function PlansPageClient({
  initialAddon,
}: {
  vertical?: string;
  initialAddon?: string;
}) {
  const validInitialAddon = initialAddon && ADD_ON_MARKETPLACE.some(
    (addon) => addon.slug === initialAddon && !addon.hiddenFromMarketplace,
  )
    ? initialAddon
    : undefined;
  const [selectedAddons, setSelectedAddons] = useState<string[]>(validInitialAddon ? [validInitialAddon] : []);
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState('');

  const toggleAddon = (slug: string) => {
    setSelectedAddons((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  async function openBillingPortal() {
    setBillingBusy(true);
    setBillingError('');
    try {
      const response = await fetch('/api/store/billing-portal', { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.url) {
        throw new Error(data?.error ?? 'Unable to open billing portal');
      }
      window.location.assign(data.url);
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : 'Unable to open billing portal');
      setBillingBusy(false);
    }
  }

  return (
    <>
      <PlatformBasePlansSection
        selectedAddonSlugs={selectedAddons}
        headline="Base plans"
        subheadline="Start with the essentials. Add AI assistants and business, education, workforce or testing modules as you grow."
      />
      <AddOnMarketplaceSection selectedSlugs={selectedAddons} onToggle={toggleAddon} />
      <section className="py-12 px-4 border-t border-slate-200">
        <div className="max-w-3xl mx-auto text-center text-sm text-slate-600">
          <div className="mb-5 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => void openBillingPortal()}
              disabled={billingBusy}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {billingBusy ? 'Opening billing…' : 'Manage subscription & billing'}
            </button>
            {billingError && <p className="text-xs font-semibold text-rose-700">{billingError}</p>}
          </div>
          <p className="mb-4">
            Need a full platform license or source-code clone?{' '}
            <Link href="/store/licenses" className="text-brand-blue-600 font-semibold hover:underline">
              Enterprise licensing
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
