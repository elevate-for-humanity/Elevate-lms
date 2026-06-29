'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlatformBasePlansSection } from '@/components/store/PlatformBasePlansSection';
import { AddOnMarketplaceSection } from '@/components/store/AddOnMarketplaceSection';

interface Props {
  vertical?: string;
}

const BEAUTY_DEFAULT_ADDONS = ['student-management', 'apprenticeship-management'];

export function PlansPageClient({ vertical }: Props) {
  const initialAddons = vertical === 'beauty' ? BEAUTY_DEFAULT_ADDONS : [];
  const [selectedAddons, setSelectedAddons] = useState<string[]>(initialAddons);

  const toggleAddon = (slug: string) => {
    setSelectedAddons((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  return (
    <>
      <PlatformBasePlansSection
        selectedAddonSlugs={selectedAddons}
        headline={vertical === 'beauty' ? 'Plans for beauty schools & salons' : 'Base plans'}
        subheadline={
          vertical === 'beauty'
            ? 'Start as a solo barber or spa at $29/month. Add student management, apprenticeship, and workforce modules as you grow.'
            : 'Start simple. Add workforce, LMS, and apprenticeship modules when you are ready.'
        }
      />
      <AddOnMarketplaceSection selectedSlugs={selectedAddons} onToggle={toggleAddon} />
      <section className="py-12 px-4 border-t border-slate-200">
        <div className="max-w-3xl mx-auto text-center text-sm text-slate-600">
          <p className="mb-4">
            Need a full platform license or source-code clone?{' '}
            <Link href="/store/licenses" className="text-brand-blue-600 font-semibold hover:underline">
              Enterprise licensing
            </Link>
            {' · '}
            <Link href="/store/beauty-programs" className="text-brand-blue-600 font-semibold hover:underline">
              Beauty program overview
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
