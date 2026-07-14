'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ChevronDown } from 'lucide-react';
import type { NavItem, NavSubItem } from '@/lib/navigation';

interface HeaderMainNavProps {
  items: NavItem[];
  programApplyLinks?: Record<string, string>;
}

function getProgramSlugFromHref(href: string): string | null {
  const match = href.match(/^\/programs\/([^/?#]+)$/);
  return match ? match[1] : null;
}

function groupSubItemsByHeader(subItems: NavSubItem[]) {
  const columns: NavSubItem[][] = [];
  let current: NavSubItem[] = [];
  for (const sub of subItems) {
    if (sub.isHeader && current.length > 0) {
      columns.push(current);
      current = [sub];
    } else {
      current.push(sub);
    }
  }
  if (current.length > 0) columns.push(current);
  return columns;
}

function DropdownLinks({
  item,
  programApplyLinks,
  onNavigate,
}: {
  item: NavItem;
  programApplyLinks: Record<string, string>;
  onNavigate?: () => void;
}) {
  if (!item.subItems?.length) return null;

  const columns = groupSubItemsByHeader(item.subItems);
  const isExternal = (href: string) => href.startsWith('http');

  const renderLink = (sub: NavSubItem) => {
    if (sub.isHeader) {
      return (
        <p
          key={sub.name}
          className="text-[11px] font-extrabold uppercase tracking-wide text-brand-red-600 px-2 pt-3 pb-1 first:pt-0"
        >
          {sub.name.replace(/—/g, '').trim()}
        </p>
      );
    }
    if (sub.isSectionLink) {
      if (!sub.href) return null;
      return (
        <Link
          key={sub.name + sub.href}
          href={sub.href}
          prefetch={false}
          onClick={onNavigate}
          {...(isExternal(sub.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="block text-xs font-bold text-brand-red-600 hover:text-brand-red-700 px-2 py-1"
        >
          {sub.name}
        </Link>
      );
    }
    if (!sub.href) return null;
    return (
      <Link
        key={sub.name + sub.href}
        href={sub.href}
        prefetch={false}
        onClick={onNavigate}
        {...(isExternal(sub.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="block text-sm text-slate-700 hover:text-brand-blue-600 hover:bg-slate-50 rounded-lg px-2 py-1.5"
      >
        {sub.name}
      </Link>
    );
  };

  if (columns.length <= 1) {
    return <div className="flex flex-col min-w-[200px] max-w-[280px]">{item.subItems.map(renderLink)}</div>;
  }

  return (
    <div className="flex gap-5 max-w-[min(90vw,720px)]">
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col min-w-[160px]">
          {col.map(renderLink)}
        </div>
      ))}
    </div>
  );
}

function HorizontalNavItem({
  item,
  programApplyLinks,
}: {
  item: NavItem;
  programApplyLinks: Record<string, string>;
}) {
  const hasMenu = Boolean(item.subItems?.length);

  if (!hasMenu && item.href) {
    return (
      <Link
        href={item.href}
        prefetch={false}
        className="text-slate-700 hover:text-brand-blue-600 font-medium text-[13px] px-2.5 py-1.5 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0"
      >
        {item.name}
      </Link>
    );
  }

  return (
    <div className="relative group shrink-0">
      {item.href ? (
        <Link
          href={item.href}
          prefetch={false}
          className="inline-flex items-center gap-0.5 text-slate-700 hover:text-brand-blue-600 font-medium text-[13px] px-2.5 py-1.5 rounded-md hover:bg-slate-50"
          aria-haspopup="true"
        >
          {item.name}
          <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform" aria-hidden />
        </Link>
      ) : (
        <button
          type="button"
          className="inline-flex items-center gap-0.5 text-slate-700 hover:text-brand-blue-600 font-medium text-[13px] px-2.5 py-1.5 rounded-md hover:bg-slate-50"
          aria-haspopup="true"
        >
          {item.name}
          <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover:rotate-180 transition-transform" aria-hidden />
        </button>
      )}

      <div className="absolute top-full left-0 pt-1 opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto transition-all duration-150 z-[10001]">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4">
          {item.href && (
            <Link
              href={item.href}
              prefetch={false}
              className="text-xs font-bold text-brand-red-600 hover:text-brand-red-700 block mb-2 px-2"
            >
              View all {item.name} →
            </Link>
          )}
          <DropdownLinks item={item} programApplyLinks={programApplyLinks} />
        </div>
      </div>
    </div>
  );
}

export default function HeaderMainNav({ items, programApplyLinks = {} }: HeaderMainNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    setExpanded(null);
  }, []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMobile();
    };
    document.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEscape);
    };
  }, [mobileOpen, closeMobile]);

  return (
    <>
      {/* Tablet / desktop / iPad — horizontal main menu + hover dropdowns */}
      <nav
        className="hidden md:flex flex-1 items-center justify-center gap-0 min-w-0 overflow-x-auto px-1"
        aria-label="Main navigation"
      >
        {items.map((item) => (
          <HorizontalNavItem key={item.id} item={item} programApplyLinks={programApplyLinks} />
        ))}
      </nav>

      {/* Mobile — hamburger + vertical accordion */}
      <div className="md:hidden flex items-center">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-slate-700 hover:bg-slate-50"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-main-nav"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] z-[10000] bg-black/40" onClick={closeMobile} aria-hidden />
      )}

      {mobileOpen && (
        <div
          id="mobile-main-nav"
          className="md:hidden fixed top-[60px] left-0 right-0 bottom-0 z-[10001] bg-white overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
        >
          <nav className="flex flex-col p-4 max-w-lg mx-auto w-full" aria-label="Mobile navigation">
            {items.map((item) => (
              <div key={item.id} className="border-b border-slate-100">
                {item.subItems?.length ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      className="flex items-center justify-between w-full py-4 text-left font-semibold text-slate-900 min-h-[48px]"
                      aria-expanded={expanded === item.id}
                    >
                      <span>{item.name}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform ${
                          expanded === item.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expanded === item.id && (
                      <div className="pb-4 pl-2 border-l-2 border-brand-red-200 ml-2">
                        {item.href && (
                          <Link
                            href={item.href}
                            prefetch={false}
                            onClick={closeMobile}
                            className="block text-sm font-bold text-brand-red-600 mb-3"
                          >
                            View all {item.name} →
                          </Link>
                        )}
                        <DropdownLinks
                          item={item}
                          programApplyLinks={programApplyLinks}
                          onNavigate={closeMobile}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  item.href && (
                    <Link
                      href={item.href}
                      prefetch={false}
                      onClick={closeMobile}
                      className="flex items-center py-4 font-semibold text-slate-900 min-h-[48px]"
                    >
                      {item.name}
                    </Link>
                  )
                )}
              </div>
            ))}
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/login"
                onClick={closeMobile}
                className="w-full text-center py-3.5 border border-slate-200 rounded-xl font-semibold"
              >
                Sign In
              </Link>
              <Link
                href="/for-students"
                onClick={closeMobile}
                className="w-full text-center py-3.5 bg-brand-red-600 text-white rounded-xl font-semibold"
              >
                Get Started
              </Link>
              <Link
                href="/apply"
                onClick={closeMobile}
                className="w-full text-center py-3.5 bg-slate-900 text-white rounded-xl font-semibold"
              >
                Apply
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
