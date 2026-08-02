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
          className="px-2 pt-3 pb-1 first:pt-0 text-[11px] font-extrabold uppercase tracking-wide text-brand-red-600"
        >
          {sub.name.replace(/—/g, '').trim()}
        </p>
      );
    }

    if (!sub.href) return null;

    if (sub.isSectionLink) {
      return (
        <Link
          key={sub.name + sub.href}
          href={sub.href}
          prefetch={false}
          onClick={onNavigate}
          {...(isExternal(sub.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="block px-2 py-1 text-xs font-bold text-brand-red-600 hover:text-brand-red-700"
        >
          {sub.name}
        </Link>
      );
    }

    return (
      <Link
        key={sub.name + sub.href}
        href={sub.href}
        prefetch={false}
        onClick={onNavigate}
        {...(isExternal(sub.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="block rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-blue-600"
      >
        {sub.name}
      </Link>
    );
  };

  if (columns.length <= 1) {
    return (
      <div className="flex min-w-[220px] max-w-[300px] flex-col">
        {item.subItems.map(renderLink)}
      </div>
    );
  }

  return (
    <div className="grid max-w-[min(92vw,900px)] grid-cols-2 gap-5 xl:grid-cols-3">
      {columns.map((column, index) => (
        <div key={index} className="flex min-w-[180px] flex-col">
          {column.map(renderLink)}
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
        className="shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-blue-600"
      >
        {item.name}
      </Link>
    );
  }

  return (
    <div className="group relative shrink-0">
      {item.href ? (
        <Link
          href={item.href}
          prefetch={false}
          className="inline-flex items-center gap-0.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-blue-600"
          aria-haspopup="true"
        >
          {item.name}
          <ChevronDown
            className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180"
            aria-hidden
          />
        </Link>
      ) : (
        <button
          type="button"
          className="inline-flex items-center gap-0.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-blue-600"
          aria-haspopup="true"
        >
          {item.name}
          <ChevronDown
            className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180"
            aria-hidden
          />
        </button>
      )}

      <div className="pointer-events-none invisible absolute left-0 top-full z-[10001] pt-2 opacity-0 transition-all duration-150 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
          {item.href && (
            <Link
              href={item.href}
              prefetch={false}
              className="mb-2 block px-2 text-xs font-bold text-brand-red-600 hover:text-brand-red-700"
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

export default function HeaderMainNav({
  items,
  programApplyLinks = {},
}: HeaderMainNavProps) {
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

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobile();
    };

    document.addEventListener('keydown', onEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEscape);
    };
  }, [mobileOpen, closeMobile]);

  return (
    <>
      {/* Desktop: true horizontal navigation with visible dropdown overflow. */}
      <nav
        className="hidden min-w-0 flex-1 items-center justify-center gap-0 overflow-visible px-1 lg:flex"
        aria-label="Main navigation"
      >
        {items.map((item) => (
          <HorizontalNavItem
            key={item.id}
            item={item}
            programApplyLinks={programApplyLinks}
          />
        ))}
      </nav>

      {/* Phone and tablet: hamburger menu. */}
      <div className="flex items-center lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-700 hover:bg-slate-50"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-main-nav"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 top-[60px] z-[10000] bg-black/40 lg:hidden"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      {mobileOpen && (
        <div
          id="mobile-main-nav"
          className="fixed bottom-0 left-0 right-0 top-[60px] z-[10001] overflow-y-auto overscroll-contain bg-white lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
        >
          <nav
            className="mx-auto flex w-full max-w-lg flex-col p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            aria-label="Mobile navigation"
          >
            {items.map((item) => (
              <div key={item.id} className="border-b border-slate-100">
                {item.subItems?.length ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setExpanded(expanded === item.id ? null : item.id)
                      }
                      className="flex min-h-[48px] w-full items-center justify-between py-4 text-left font-semibold text-slate-900"
                      aria-expanded={expanded === item.id}
                    >
                      <span>{item.name}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-slate-400 transition-transform ${
                          expanded === item.id ? 'rotate-180' : ''
                        }`}
                        aria-hidden
                      />
                    </button>

                    {expanded === item.id && (
                      <div className="ml-2 border-l-2 border-brand-red-200 pb-4 pl-3">
                        {item.href && (
                          <Link
                            href={item.href}
                            prefetch={false}
                            onClick={closeMobile}
                            className="mb-3 block text-sm font-bold text-brand-red-600"
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
                      className="flex min-h-[48px] items-center py-4 font-semibold text-slate-900"
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
                className="w-full rounded-xl border border-slate-200 py-3.5 text-center font-semibold"
              >
                Sign In
              </Link>
              <Link
                href="/for-students"
                onClick={closeMobile}
                className="w-full rounded-xl bg-brand-red-600 py-3.5 text-center font-semibold text-white"
              >
                Get Started
              </Link>
              <Link
                href="/apply"
                onClick={closeMobile}
                className="w-full rounded-xl bg-slate-900 py-3.5 text-center font-semibold text-white"
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
