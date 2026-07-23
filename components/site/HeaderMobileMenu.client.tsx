'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Menu, X, Lock, Phone } from 'lucide-react';
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
        className="flex items-center gap-1.5 py-2 text-sm font-semibold text-brand-red-600 hover:text-brand-red-700"
      >
        {subItem.isAuth && <Lock className="h-3 w-3 flex-shrink-0" aria-hidden="true" />}
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
        className={`flex items-center gap-1.5 py-2.5 text-sm text-slate-700 hover:text-brand-blue-600 ${
          nested ? 'pl-2 text-slate-600' : ''
        }`}
      >
        {subItem.isAuth && <Lock className="h-3 w-3 flex-shrink-0 text-slate-400" aria-hidden="true" />}
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
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const closeMenu = () => setIsOpen(false);
  const toggleSection = (key: string) =>
    setExpandedSection((prev) => (prev === key ? null : key));

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setExpandedSection(null);
    setExpandedCategory(null);
  }, [pathname]);

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
              className="fixed inset-0 bg-black/50 z-[10000] md:hidden"
              onClick={closeMenu}
              aria-hidden="true"
            />
            <div
              className="fixed top-[60px] right-0 bottom-0 w-[min(100vw,26rem)] bg-white z-[10001] flex flex-col shadow-2xl md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
            >
              {/* Scrollable nav content */}
              <nav className="flex-1 overflow-y-auto p-4" aria-label="Site menu">
                {items.map((item) => {
                  const sectionKey = item.id ?? item.name;
                  const hasSubItems = Boolean(item.subItems?.length);
                  const sectionOpen = expandedSection === sectionKey;
                  const columns = hasSubItems
                    ? Object.values(groupNavSubItemsByHeader(item.subItems!))
                    : [];
                  const useCategoryAccordions = columns.length > 1;

                  return (
                    <section key={item.name} className="border-b border-slate-100 last:border-0">
                      {hasSubItems ? (
                        <button
                          type="button"
                          onClick={() => toggleSection(sectionKey)}
                          className="flex w-full items-center justify-between py-3 text-left text-base font-semibold text-slate-900 hover:text-brand-blue-600"
                          aria-expanded={sectionOpen}
                          aria-controls={`mobile-section-${sectionKey}`}
                        >
                          {item.name}
                          <ChevronDown
                            className={`h-4 w-4 flex-none text-slate-400 transition-transform ${
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
                          className="flex py-3 text-base font-semibold text-slate-900 hover:text-brand-blue-600"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="py-3 text-base font-semibold text-slate-900">{item.name}</p>
                      )}

                      {hasSubItems && sectionOpen ? (
                        <div
                          id={`mobile-section-${sectionKey}`}
                          className="flex flex-col pb-4 pl-3 border-l-2 border-brand-red-200"
                        >
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
                                    <div className="flex min-h-[40px] items-center gap-1">
                                      {column[0]?.href ? (
                                        <Link
                                          href={column[0].href}
                                          prefetch={false}
                                          onClick={closeMenu}
                                          className="min-w-0 flex-1 py-2 text-xs font-extrabold uppercase tracking-wide text-brand-red-600 hover:text-brand-red-700"
                                        >
                                          {label}
                                        </Link>
                                      ) : (
                                        <span className="min-w-0 flex-1 py-2 text-xs font-extrabold uppercase tracking-wide text-brand-red-600">
                                          {label}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedCategory(categoryOpen ? null : categoryKey)
                                        }
                                        className="flex h-10 w-10 flex-none items-center justify-center text-brand-red-600 hover:text-brand-red-700"
                                        aria-label={`${categoryOpen ? 'Collapse' : 'Expand'} ${label}`}
                                        aria-expanded={categoryOpen}
                                      >
                                        <ChevronDown
                                          className={`h-4 w-4 flex-none text-brand-red-400 transition-transform ${
                                            categoryOpen ? 'rotate-180' : ''
                                          }`}
                                          aria-hidden="true"
                                        />
                                      </button>
                                    </div>
                                    {categoryOpen ? (
                                      <div className="pl-2 pb-2 border-l border-slate-200 ml-1">
                                        {column.map((subItem) =>
                                          !subItem ? null : (
                                            <MobileSubLink
                                              key={`${subItem.name}-${subItem.href}`}
                                              subItem={subItem}
                                              itemId={item.id}
                                              programApplyLinks={programApplyLinks}
                                              onNavigate={closeMenu}
                                            />
                                          ),
                                        )}
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
              </nav>

              {/* Sticky footer */}
              <div className="border-t border-slate-200 p-4 bg-white">
                <div className="flex gap-2 mb-3">
                  <Link
                    href="/apply"
                    prefetch={false}
                    onClick={closeMenu}
                    className="flex-1 text-center py-3 bg-brand-red-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-red-700"
                  >
                    Apply Now
                  </Link>
                  <Link
                    href="/login"
                    prefetch={false}
                    onClick={closeMenu}
                    className="flex-1 text-center py-3 border border-slate-300 text-slate-800 rounded-lg font-semibold text-sm hover:bg-slate-50 flex items-center justify-center gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    Sign In
                  </Link>
                </div>
                <a
                  href="tel:+13173143757"
                  className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-brand-blue-600"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  (317) 314-3757
                </a>
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <div className="flex flex-row flex-nowrap items-center justify-end gap-0.5 shrink-0">
      <SearchModal />
      <LanguageSwitcher compact={true} />
      <span className="md:hidden">
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
