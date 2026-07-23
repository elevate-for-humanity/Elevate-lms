// Server Component - NO 'use client'
// Static desktop navigation links

import Link from 'next/link';
import { groupNavSubItemsByHeader } from '@/lib/navigation';
import { Lock } from 'lucide-react';

interface SubItem {
  name: string;
  href: string;
  isHeader?: boolean;
  isSectionLink?: boolean;
  isAuth?: boolean;
}

interface NavItem {
  name: string;
  href?: string;
  subItems?: SubItem[];
}

export default function HeaderDesktopNav({ items }: { items: NavItem[] }) {
  const isExternal = (href: string) => href?.startsWith('http');

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-1">
      {items.map((item) => (
        <div key={item.name} className="relative group">
          {item.href ? (
            <Link
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue-600"
            >
              {item.name}
            </Link>
          ) : (
            <button className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue-600">
              {item.name}
            </button>
          )}

          {item.subItems && item.subItems.length > 0 && (
            <div className="absolute top-full left-0 pt-2 z-50 invisible opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div
                className={`max-h-[calc(100vh-5rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-lg ${
                  item.id === 'programs'
                    ? 'grid w-[min(92vw,64rem)] grid-cols-4 gap-x-5 gap-y-3'
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
                          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-blue-600 ${
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
      ))}
    </nav>
  );
}
