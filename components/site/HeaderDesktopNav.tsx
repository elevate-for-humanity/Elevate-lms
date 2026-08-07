'use client';

import Link from 'next/link';
import type { NavItem } from '@/types/navigation';

/**
 * Desktop navigation stays a single horizontal row. Inline layout guards are
 * intentional here so broad/global nav CSS cannot collapse the desktop header
 * into the mobile vertical pattern.
 */
export default function HeaderDesktopNav({ items }: { items: NavItem[] }) {
  return (
    <nav
      aria-label="Main navigation"
      className="items-center justify-center gap-1 whitespace-nowrap"
      style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' }}
    >
      {items.map((item) => {
        if (!item.href) return null;

        return (
          <Link
            key={item.id ?? item.name}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
