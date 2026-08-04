'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { groupNavSubItemsByHeader } from '@/lib/navigation';
import { Lock } from 'lucide-react';
import type { NavItem } from '@/types/navigation';

const RIGHT_SIDE_IDS = new Set(['portals', 'about', 'applications', 'store']);

export default function HeaderDesktopNav({ items }: { items: NavItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const isExternal = (href: string) => href?.startsWith('http');

  useEffect(() => {
    if (!openId) return;
    const handle = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenId(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleKey);
    };
  }, [openId]);

  const toggle = (id: string) =>
    setOpenId((prev) => (prev === id ? null : id));

  return (
    <nav
      ref={navRef}
      aria-label="Main navigation"
      className="flex items-center gap-0.5 whitespace-nowrap overflow-x-auto scrollbar-hide -mx-2 px-2"
    >
      {items.map((item) => {
        const hasSubItems = Boolean(item.subItems?.length);
        const alignRight = RIGHT_SIDE_IDS.has(item.id ?? '');
        const isOpen = openId === item.id;
        const dropdownId = `nav-dropdown-${item.id ?? item.name}`;
        const btnId = `nav-btn-${item.id ?? item.name}`;

        return (
          <div key={item.id ?? item.name} className="relative flex-shrink-0">
            {item.href && !hasSubItems ? (
              <Link
                href={item.href}
                className="whitespace-nowrap px-2 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-brand-blue-600 rounded-md"
              >
                {item.name}
              </Link>
            ) : (
              <button
                id={btnId}
                type="button"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={hasSubItems ? dropdownId : undefined}
                onClick={() => toggle(item.id ?? item.name)}
                className="whitespace-nowrap px-2 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-brand-blue-600 rounded-md"
              >
                {item.name}
              </button>
            )}

            {hasSubItems && (
              <div
                id={dropdownId}
                role="menu"
                aria-labelledby={btnId}
                className={`absolute top-full pt-2 z-50 transition-all duration-150 ease-out ${
                  isOpen
                    ? 'visible opacity-100 translate-y-0'
                    : 'invisible opacity-0 -translate-y-1'
                } ${alignRight ? 'left-auto right-0' : 'left-0'}`}
              >
                <div
                  className={`max-h-[calc(100vh-5rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-3 shadow-lg ${
                    item.id === 'programs'
                      ? 'grid w-[min(92vw,64rem)] grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-x-5 gap-y-3'
                      : 'min-w-[15rem]'
                  }`}
                >
                  {Object.values(groupNavSubItemsByHeader(item.subItems))
                    .filter((group) => group.some((sub) => !sub.isHeader))
                    .map((group) => {
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
                              href={sub.href ?? '#'}
                              role="menuitem"
                              onClick={() => setOpenId(null)}
                              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-brand-blue-600 whitespace-nowrap ${
                                sub.isSectionLink ? 'font-semibold text-brand-red-600' : ''
                              }`}
                              {...(isExternal(sub.href ?? '')
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
