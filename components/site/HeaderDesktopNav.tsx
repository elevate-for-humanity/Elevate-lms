'use client';

import Link from 'next/link';
import type { NavItem } from '@/types/navigation';

/**
 * Desktop navigation intentionally stays simple and static.
 * Mobile owns the expandable category experience; desktop shows one clean row
 * of canonical top-level destinations with no horizontal scroll or mega-menu.
 */
export default function HeaderDesktopNav({ items }: { items: NavItem[] }) {
  return (
    <nav aria-label="Main navigation" className="flex items-center justify-center gap-1 whitespace-nowrap">
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
