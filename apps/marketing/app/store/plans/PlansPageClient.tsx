'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlatformBasePlansSection } from '@/components/store/PlatformBasePlansSection';
import { AddOnMarketplaceSection } from '@/components/store/AddOnMarketplaceSection';

export function PlansPageClient() {
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const toggleAddon = (slug: string) => {
    setSelectedAddons((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  return (
    <>
      <PlatformBasePlansSection
        selectedAddonSlugs={selectedAddons}
        headline="Base plans"
        subheadline="Start simple. Add workforce, LMS, and apprenticeship modules when you are ready."
      />
      <AddOnMarketplaceSection selectedSlugs={selectedAddons} onToggle={toggleAddon} />
      <section className="py-12 px-4 border-t border-slate-200">
        <div className="max-w-3xl mx-auto text-center text-sm text-slate-600">
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
