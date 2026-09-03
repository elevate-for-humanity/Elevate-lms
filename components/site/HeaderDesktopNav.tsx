'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { NavItem, NavSubItem } from '@/types/navigation';

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function DropdownContent({ subItems, embedded = false }: { subItems: NavSubItem[]; embedded?: boolean }) {
  return (
    <div className={embedded ? 'min-w-0 p-1' : 'max-h-[min(78vh,44rem)] min-w-[280px] max-w-[380px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-2xl'}>
      {subItems.map((sub) => {
        if (sub.isHeader) {
          return (
            <div key={`${sub.name}-${sub.href ?? 'header'}`} className="px-2 pb-1 pt-3 first:pt-1">
              {sub.href ? (
                <Link
                  href={sub.href}
                  prefetch={false}
                  className="text-[11px] font-extrabold uppercase tracking-wide text-brand-red-700 hover:underline"
                >
                  {sub.name.replace(/—/g, '').trim()}
                </Link>
              ) : (
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand-red-700">
                  {sub.name.replace(/—/g, '').trim()}
                </p>
              )}
            </div>
          );
        }

        if (!sub.href) return null;

        return (
          <Link
            key={`${sub.name}-${sub.href}`}
            href={sub.href}
            prefetch={false}
            {...(isExternal(sub.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
          >
            {sub.name}
          </Link>
        );
      })}
    </div>
  );
}

function MoreDropdown({ items }: { items: NavItem[] }) {
  return (
    <div className="grid w-[min(92vw,42rem)] grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:grid-cols-3">
      {items.map((item) => (
        <section key={item.id ?? item.name} className="min-w-0">
          {item.href ? (
            <Link href={item.href} prefetch={false} className="block rounded-md px-2 py-2 text-sm font-extrabold text-slate-950 hover:bg-slate-50 hover:text-brand-blue-700">
              {item.name}
            </Link>
          ) : (
            <p className="px-2 py-2 text-sm font-extrabold text-slate-950">{item.name}</p>
          )}
          {item.subItems?.length ? <DropdownContent subItems={item.subItems} embedded /> : null}
        </section>
      ))}
    </div>
  );
}

const topLevelClass =
  'rounded-md px-1.5 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 xl:px-2.5 xl:text-sm';

export default function HeaderDesktopNav({ items }: { items: NavItem[] }) {
  // Platform and Resources are public discovery surfaces, not hidden utilities.
  // Authenticated portals remain discoverable while authorization still gates data/actions.
  const primaryItems = items.filter((item) =>
    ['programs', 'apprenticeships', 'funding', 'platform', 'employers', 'resources', 'portals'].includes(item.id ?? ''),
  );
  const secondaryItems = items.filter((item) => !primaryItems.includes(item));

  return (
    <nav
      aria-label="Main navigation"
      className="flex min-w-0 flex-row flex-nowrap items-center justify-center gap-0 overflow-visible whitespace-nowrap xl:gap-0.5"
    >
      {primaryItems.map((item) => {
        const key = item.id ?? item.name;
        const hasSubItems = Boolean(item.subItems?.length);

        if (!hasSubItems) {
          if (!item.href) return null;
          return (
            <Link key={key} href={item.href} prefetch={false} className={topLevelClass}>
              {item.name}
            </Link>
          );
        }

        return (
          <div key={key} className="group relative shrink-0">
            <div className="flex items-center">
              {item.href ? (
                <Link
                  href={item.href}
                  prefetch={false}
                  className={`inline-flex items-center gap-0.5 xl:gap-1 ${topLevelClass}`}
                  aria-haspopup="menu"
                >
                  <span>{item.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180 xl:h-3.5 xl:w-3.5" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  className={`inline-flex items-center gap-0.5 xl:gap-1 ${topLevelClass}`}
                  aria-haspopup="menu"
                >
                  <span>{item.name}</span>
                  <ChevronDown className="h-3 w-3 text-slate-400 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180 xl:h-3.5 xl:w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="pointer-events-none invisible absolute left-1/2 top-full z-[12000] -translate-x-1/2 pt-2 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
              <DropdownContent subItems={item.subItems ?? []} />
            </div>
          </div>
        );
      })}
      {secondaryItems.length ? (
        <div className="group relative shrink-0">
          <button type="button" className={`inline-flex items-center gap-1 ${topLevelClass}`} aria-haspopup="menu">
            <span>More</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-150 group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden="true" />
          </button>
          <div className="pointer-events-none invisible absolute right-0 top-full z-[12000] pt-2 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
            <MoreDropdown items={secondaryItems} />
          </div>
        </div>
      ) : null}
    </nav>
  );
}
