'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import SearchModal from './SearchModal.client';
import LanguageSwitcher from './LanguageSwitcher.client';
import {
  groupNavSubItemsByHeader,
  getNavCategoryLabel,
  type NavItem,
  type NavSubItem,
} from '@/lib/navigation';

interface HeaderMobileMenuProps {
  items: NavItem[];
  programApplyLinks?: Record<string, string>;
}

function getProgramSlugFromHref(href: string): string | null {
  const match = href.match(/^\/programs\/([^/?#]+)$/);
  if (!match) return null;
  return match[1];
}

function isExternalHref(href: string) {
  return href.startsWith('http');
}

function MobileSubLink({
  subItem,
  itemId,
  programApplyLinks,
  onNavigate,
  nested,
}: {
  subItem: NavSubItem;
  itemId?: string;
  programApplyLinks: Record<string, string>;
  onNavigate: () => void;
  nested?: boolean;
}) {
  if (subItem.isHeader) return null;

  if (subItem.isSectionLink) {
    return (
      <Link
        href={subItem.href}
        prefetch={false}
        onClick={onNavigate}
        {...(isExternalHref(subItem.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="block py-2 text-sm font-semibold text-brand-red-600 hover:text-brand-red-700"
      >
        {subItem.name}
      </Link>
    );
  }

  const programSlug = itemId === 'programs' ? getProgramSlugFromHref(subItem.href) : null;
  const applyHref = programSlug ? programApplyLinks[programSlug] : undefined;

  return (
    <div>
      <Link
        href={subItem.href}
        prefetch={false}
        onClick={onNavigate}
        {...(isExternalHref(subItem.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={`block py-2.5 text-sm text-slate-700 hover:text-brand-blue-600 ${
          nested ? 'pl-2 text-slate-600' : ''
        }`}
      >
        {subItem.name}
      </Link>
      {applyHref ? (
        <Link
          href={applyHref}
          prefetch={false}
          onClick={onNavigate}
          className="block py-1.5 pl-3 text-xs font-medium text-brand-blue-700 hover:underline"
        >
          Apply to {subItem.name}
        </Link>
      ) : null}
    </div>
  );
}

export default function HeaderMobileMenu({ items, programApplyLinks = {} }: HeaderMobileMenuProps) {
  const firstItemKey = items[0]?.id ?? items[0]?.name ?? null;
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(firstItemKey);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setExpandedSection(firstItemKey);
    setExpandedCategory(null);
  }, [pathname, firstItemKey]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const drawer =
    mounted && isOpen
      ? createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[9998] lg:hidden"
              onClick={closeMenu}
              aria-hidden="true"
            />
            <div
              className="fixed top-[60px] right-0 bottom-0 w-[min(100vw,26rem)] bg-white z-[9999] overflow-y-auto shadow-2xl lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
            >
              <nav className="flex flex-col p-4 pb-10" aria-label="Site menu">
                {items.map((item) => {
                  const sectionKey = item.id ?? item.name;
                  const hasSubItems = Boolean(item.subItems?.length);
                  const sectionOpen = expandedSection === sectionKey;
                  const columns = hasSubItems ? groupNavSubItemsByHeader(item.subItems!) : [];
                  const useCategoryAccordions = columns.length > 1;

                  return (
                    <section key={item.name} className="border-b border-slate-100 last:border-0">
                      {hasSubItems ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (sectionOpen) {
                              setExpandedSection(null);
                              setExpandedCategory(null);
                            } else {
                              setExpandedSection(sectionKey);
                              setExpandedCategory(null);
                            }
                          }}
                          className="flex min-h-[48px] w-full items-center justify-between gap-3 py-3 text-left text-base font-semibold text-slate-900 hover:text-brand-blue-600"
                          aria-expanded={sectionOpen}
                        >
                          <span>{item.name}</span>
                          <ChevronDown
                            className={`h-5 w-5 flex-none text-slate-400 transition-transform ${
                              sectionOpen ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      ) : item.href ? (
                        <Link
                          href={item.href}
                          prefetch={false}
                          onClick={closeMenu}
                          className="block py-3 text-base font-semibold text-slate-900 hover:text-brand-blue-600"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="py-3 text-base font-semibold text-slate-900">{item.name}</p>
                      )}

                      {hasSubItems && sectionOpen ? (
                        <div className="flex flex-col pb-4 pl-3 border-l-2 border-brand-red-200">
                          {item.href ? (
                            <Link
                              href={item.href}
                              prefetch={false}
                              onClick={closeMenu}
                              className="block py-2 text-sm font-bold text-brand-red-600 hover:text-brand-red-700"
                            >
                              View all {item.name} →
                            </Link>
                          ) : null}

                          {useCategoryAccordions
                            ? columns.map((column, columnIndex) => {
                                const categoryKey = `${sectionKey}::${columnIndex}`;
                                const categoryOpen = expandedCategory === categoryKey;
                                const label = getNavCategoryLabel(column);

                                return (
                                  <div key={categoryKey} className="mt-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedCategory(categoryOpen ? null : categoryKey)
                                      }
                                      className="flex min-h-[40px] w-full items-center justify-between gap-2 py-2 text-left text-xs font-extrabold uppercase tracking-wide text-brand-red-600"
                                      aria-expanded={categoryOpen}
                                    >
                                      <span>{label}</span>
                                      <ChevronDown
                                        className={`h-4 w-4 flex-none text-brand-red-400 transition-transform ${
                                          categoryOpen ? 'rotate-180' : ''
                                        }`}
                                        aria-hidden="true"
                                      />
                                    </button>
                                    {categoryOpen ? (
                                      <div className="pl-2 pb-2 border-l border-slate-200 ml-1">
                                        {column.map((subItem) => (
                                          <MobileSubLink
                                            key={`${subItem.name}-${subItem.href}`}
                                            subItem={subItem}
                                            itemId={item.id}
                                            programApplyLinks={programApplyLinks}
                                            onNavigate={closeMenu}
                                          />
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })
                            : item.subItems!.map((subItem) =>
                                subItem.isHeader ? (
                                  <p
                                    key={subItem.name}
                                    className="pt-3 pb-1 text-xs font-extrabold uppercase tracking-wide text-brand-red-600"
                                  >
                                    {subItem.name.replace(/—/g, '').trim()}
                                  </p>
                                ) : (
                                  <MobileSubLink
                                    key={`${subItem.name}-${subItem.href}`}
                                    subItem={subItem}
                                    itemId={item.id}
                                    programApplyLinks={programApplyLinks}
                                    onNavigate={closeMenu}
                                    nested={subItem.nested}
                                  />
                                ),
                              )}
                        </div>
                      ) : null}
                    </section>
                  );
                })}

                <div className="mt-6 flex flex-col gap-2">
                  <Link
                    href="/for-students"
                    prefetch={false}
                    onClick={closeMenu}
                    className="block w-full text-center py-3 bg-brand-red-600 text-white rounded-lg font-semibold"
                  >
                    Get Started
                  </Link>
                  <Link
                    href="/portals"
                    prefetch={false}
                    onClick={closeMenu}
                    className="block w-full text-center py-3 border border-slate-300 text-slate-800 rounded-lg font-semibold hover:bg-slate-50"
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    href="/login"
                    prefetch={false}
                    onClick={closeMenu}
                    className="block w-full text-center py-2.5 text-slate-600 font-medium text-sm hover:underline"
                  >
                    Sign in (all roles)
                  </Link>
                  <Link
                    href="/apply"
                    prefetch={false}
                    onClick={closeMenu}
                    className="block w-full text-center py-2.5 text-brand-blue-600 font-medium text-sm hover:underline"
                  >
                    Check eligibility
                  </Link>
                </div>
              </nav>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="flex flex-row flex-nowrap items-center justify-end gap-0.5 shrink-0">
      <SearchModal />
      <LanguageSwitcher compact={true} />
      {/* Hamburger + side drawer are mobile/tablet only. On lg+ the horizontal
          HeaderDesktopNav (with hover dropdowns) is the navigation. The wrapper
          span carries lg:hidden so it doesn't collide with the button's own
          display:flex utility. */}
      <span className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </span>
      {drawer}
    </div>
  );
}
