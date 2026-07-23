// Server Component - NO 'use client'
// Static desktop navigation links

import Link from 'next/link';
import { groupNavSubItemsByHeader } from '@/lib/navigation';
import { Lock } from 'lucide-react';
import type { NavItem } from '@/types/navigation';

// Item ids that should have right-aligned dropdowns (right side of nav)
const RIGHT_SIDE_IDS = new Set(['portals', 'about', 'applications', 'store']);

export default function HeaderDesktopNav({ items }: { items: NavItem[] }) {
  const isExternal = (href: string) => href?.startsWith('http');

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-0.5 whitespace-nowrap">
      {items.map((item, idx) => {
        const hasSubItems = Boolean(item.subItems?.length);
        // Right-align dropdowns for items on the right side of the nav
        const alignRight = RIGHT_SIDE_IDS.has(item.id);
        const dropdownId = `nav-dropdown-${item.id ?? idx}`;

        return (
          <div key={item.id ?? item.name} className="relative group">
            {item.href && !hasSubItems ? (
              <Link
                href={item.href}
                className="whitespace-nowrap px-2 xl:px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue-600 rounded-md"
              >
                {item.name}
              </Link>
            ) : (
              <button
                type="button"
                className="whitespace-nowrap px-2 xl:px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue-600 rounded-md"
                aria-haspopup={hasSubItems ? 'menu' : undefined}
                aria-expanded={hasSubItems ? undefined : undefined}
                aria-controls={hasSubItems ? dropdownId : undefined}
              >
                {item.name}
              </button>
            )}

            {hasSubItems && (
              <div
                id={dropdownId}
                className={`absolute top-full pt-2 z-50 invisible opacity-0 transition-all duration-150 ease-out translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 ${
                  alignRight ? 'left-auto right-0' : 'left-0'
                }`}
              >
                <div
                  className={`max-h-[calc(100vh-5rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-lg ${
                    item.id === 'programs'
                      ? 'grid w-[min(92vw,64rem)] grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-5 gap-y-3'
                      : 'min-w-[15rem]'
                  }`}
                >
                  {Object.values(groupNavSubItemsByHeader(item.subItems)).map((group) => {
                    const heading = group.find((sub) => sub.isHeader);
                    const links = group.filter((sub) => !sub.isHeader);

                    return (
                      <div key={heading?.name ?? group[0]?.name} className="min-w-0">
                        {heading ? (
                          <p className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-brand-red-600">
                            {heading.name.replace(/—/g, '').trim()}
                          </p>
                        ) : null}
                        {links.map((sub) => (
                          <Link
                            key={`${sub.href}-${sub.name}`}
                            href={sub.href}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-blue-600 whitespace-nowrap ${
                              sub.isSectionLink ? 'font-semibold text-brand-red-600' : ''
                            }`}
                            {...(isExternal(sub.href)
                              ? { target: '_blank', rel: 'noopener noreferrer' }
                              : {})}
                          >
                            {sub.isAuth && <Lock className="h-3 w-3 flex-shrink-0 text-slate-400" aria-hidden="true" />}
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
