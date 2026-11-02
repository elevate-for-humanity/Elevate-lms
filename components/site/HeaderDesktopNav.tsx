'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { NavItem, NavSubItem } from '@/types/navigation';

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function DropdownContent({ subItems, onNavigate }: { subItems: NavSubItem[]; onNavigate: () => void }) {
  return (
    <div className="max-h-[min(78vh,44rem)] min-w-[280px] max-w-[380px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-2xl">
      {subItems.map((sub) => {
        if (!sub.href) return sub.isHeader ? <p key={sub.name} className="px-2 py-2 text-xs font-bold text-brand-red-700">{sub.name}</p> : null;
        return (
          <Link
            key={`${sub.name}-${sub.href}`}
            href={sub.href}
            prefetch={false}
            onClick={onNavigate}
            {...(isExternal(sub.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="block min-h-11 rounded-lg px-2 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500"
          >
            {sub.name}
          </Link>
        );
      })}
    </div>
  );
}

const topLevelClass = 'rounded-md px-1.5 py-2 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-500 xl:px-2.5 xl:text-sm';

export default function HeaderDesktopNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const close = () => { setOpen(null); setPinned(false); };
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  return (
    <nav aria-label="Main navigation" className="flex w-full min-w-0 flex-row flex-nowrap items-center justify-center gap-1 overflow-visible whitespace-nowrap xl:gap-2">
      {items.map((item) => {
        const key = item.id ?? item.name;
        if (!item.subItems?.length) return item.href ? <Link key={key} href={item.href} prefetch={false} className={topLevelClass}>{item.name}</Link> : null;
        const expanded = open === key;
        const panelId = `desktop-nav-${key}`;
        return (
          <div key={key} className="relative shrink-0"
            onMouseEnter={() => { if (open !== key) { setOpen(key); setPinned(false); } }}
            onMouseLeave={close}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') { event.preventDefault(); close(); triggers.current[key]?.focus(); }
              if (event.key === 'ArrowDown' && event.target === triggers.current[key]) { event.preventDefault(); setOpen(key); setPinned(true); requestAnimationFrame(() => document.getElementById(panelId)?.querySelector<HTMLAnchorElement>('a')?.focus()); }
            }}>
            <div className="flex items-center">
              {item.href ? <Link href={item.href} prefetch={false} onClick={close} className={topLevelClass}>{item.name}</Link> : null}
              <button type="button" onClick={() => { if (expanded && pinned) close(); else { setOpen(key); setPinned(true); } }}
                ref={(node) => { triggers.current[key] = node; }}
                className={`${topLevelClass} inline-flex min-h-11 items-center gap-1 px-1`}
                aria-label={item.href ? `${item.name} menu` : item.name}
                aria-expanded={expanded} aria-controls={panelId}>
                {!item.href ? item.name : null}
                <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div id={panelId} hidden={!expanded} className="absolute left-1/2 top-full z-[12000] -translate-x-1/2 pt-2">
              <DropdownContent subItems={item.subItems} onNavigate={close} />
            </div>
          </div>
        );
      })}
    </nav>
  );
}
