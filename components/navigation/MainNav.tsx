'use client';

// Dropdown navigation component driven by lib/navigation.ts.
// Replaces inline NAV_ITEMS in Header.tsx — import this instead of
// duplicating nav data in the header.

import Link from 'next/link';
import { useState } from 'react';
import { NAV_ITEMS, type NavItem } from '@/lib/navigation';

export default function MainNav() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav className="hidden lg:flex items-center gap-6" aria-label="Main navigation">
      {NAV_ITEMS.map((item: NavItem) => {
        const hasDropdown = item.subItems && item.subItems.length > 0;
        const isCta = item.id === 'apply';

        if (isCta) {
          return (
            <Link
              key={item.id}
              href={item.href!}
              className="bg-brand-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-red-700 transition-colors"
            >
              {item.name}
            </Link>
          );
        }

        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => setOpen(item.id)}
            onMouseLeave={() => setOpen(null)}
          >
            {item.href ? (
              <Link
                href={item.href}
                prefetch={false}
                className="text-slate-700 hover:text-brand-blue-600 font-medium text-sm transition-colors py-2"
              >
                {item.name}
              </Link>
            ) : (
              <button
                type="button"
                className="text-slate-700 hover:text-brand-blue-600 font-medium text-sm transition-colors py-2"
              >
                {item.name}
              </button>
            )}

            {hasDropdown && open === item.id && (
              <div className="absolute top-full left-0 bg-white shadow-xl rounded-xl border border-slate-100 p-4 min-w-[220px] z-50">
                <div className="flex flex-col gap-1">
                  {item.subItems!.map((sub) =>
                    sub.isHeader ? (
                      <p
                        key={sub.href + sub.name}
                        className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-3 mb-1 first:mt-0 px-2"
                      >
                        {sub.name.replace(/^—\s*/, '').replace(/\s*—$/, '')}
                      </p>
                    ) : (
                      <Link
                        key={sub.href + sub.name}
                        href={sub.href}
                        prefetch={false}
                        className="text-sm text-slate-700 hover:text-brand-blue-600 hover:bg-slate-50 rounded-lg px-2 py-1.5 transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
