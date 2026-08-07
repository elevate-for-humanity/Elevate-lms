'use client';

import { useEffect, useRef, useState } from 'react';
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
import { ROUTES } from '@/lib/navigation/routes';
import { siteUrls } from '@/lib/utils/site-urls';

interface HeaderMobileMenuProps {
  items: NavItem[];
  programApplyLinks?: Record<string, string>;
}

function getProgramSlugFromHref(href: string): string | null {
  const match = href.match(/^\/programs\/([^/?#]+)$/);
  return match?.[1] ?? null;
}

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function phoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `tel:${digits.length === 10 ? `+1${digits}` : `+${digits}`}`;
}

function MenuLink({
  href,
  children,
  onNavigate,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate: () => void;
  className: string;
}) {
  if (isExternalHref(href)) {
    return (
      <a href={href} onClick={onNavigate} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={false} onClick={onNavigate} className={className}>
      {children}
    </Link>
  );
}

function MobileSubLink({
  subItem,
  itemId,
  programApplyLinks,
  onNavigate,
}: {
  subItem: NavSubItem;
  itemId?: string;
  programApplyLinks: Record<string, string>;
  onNavigate: () => void;
}) {
  if (subItem.isHeader) return null;
  const href = subItem.href ?? '#';

  if (subItem.isSectionLink) {
    return (
      <MenuLink
        href={href}
        onNavigate={onNavigate}
        className="flex items-center gap-1.5 py-2 min-h-[40px] text-sm font-semibold text-brand-red-600 hover:text-brand-red-700"
      >
        {subItem.isAuth && <Lock className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />}
        <span className="break-words">{subItem.name}</span>
      </MenuLink>
    );
  }

  const programSlug = itemId === 'programs' ? getProgramSlugFromHref(href) : null;
  const applyHref = programSlug ? programApplyLinks[programSlug] : undefined;

  return (
    <div>
      <MenuLink
        href={href}
        onNavigate={onNavigate}
        className="flex items-center gap-1.5 py-2 min-h-[40px] text-sm text-slate-700 hover:text-brand-blue-600"
      >
        {subItem.isAuth && <Lock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />}
        <span className="break-words">{subItem.name}</span>
      </MenuLink>
      {applyHref ? (
        <MenuLink
          href={applyHref}
          onNavigate={onNavigate}
          className="block py-1.5 pl-6 min-h-[32px] text-xs font-medium text-brand-blue-700 hover:underline"
        >
          Apply to {subItem.name}
        </MenuLink>
      ) : null}
    </div>
  );
}

export default function HeaderMobileMenu({ items, programApplyLinks = {} }: HeaderMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const pathname = usePathname();
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    setIsOpen(false);
    setExpandedSection(null);
    setExpandedCategory(null);
  };

  const toggleSection = (key: string) =>
    setExpandedSection((previous) => {
      if (previous === key) return null;
      setExpandedCategory(null);
      return key;
    });

  useEffect(() => closeMenu(), [pathname]);

  useEffect(() => {
    if (isOpen) requestAnimationFrame(() => firstFocusRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const drawer = isOpen
    ? createPortal(
        <>
          <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={closeMenu} aria-hidden="true" />
          <div
            className="fixed inset-y-0 right-0 w-[min(100vw,26rem)] bg-white z-[10000] flex flex-col shadow-2xl pt-[env(safe-area-inset-top)]"
            role="dialog"
            aria-modal="true"
            aria-label="Main navigation"
            aria-labelledby="mobile-nav-title"
          >
            <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4 shrink-0">
              <h2 className="font-semibold text-slate-900 text-base" id="mobile-nav-title">Menu</h2>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close navigation"
                className="flex h-11 w-11 items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-2" aria-label="Site navigation">
              {items.map((item, index) => {
                const sectionKey = item.id ?? item.name;
                const hasSubItems = Boolean(item.subItems?.length);
                const sectionOpen = expandedSection === sectionKey;
                const columns = hasSubItems ? Object.values(groupNavSubItemsByHeader(item.subItems!)) : [];
                const useCategoryAccordions = columns.length > 1;

                return (
                  <section key={sectionKey} className="border-b border-slate-100 last:border-0">
                    {hasSubItems ? (
                      <button
                        ref={index === 0 ? firstFocusRef : undefined}
                        type="button"
                        onClick={() => toggleSection(sectionKey)}
                        className="flex w-full items-center justify-between py-2.5 min-h-[44px] text-left text-base font-semibold text-slate-900 hover:text-brand-blue-600"
                        aria-expanded={sectionOpen}
                        aria-controls={`mobile-section-${sectionKey}`}
                      >
                        <span className="break-words pr-2">{item.name}</span>
                        <ChevronDown
                          className={`h-5 w-5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${sectionOpen ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                    ) : item.href ? (
                      <MenuLink
                        href={item.href}
                        onNavigate={closeMenu}
                        className="flex py-2.5 min-h-[44px] text-base font-semibold text-slate-900 hover:text-brand-blue-600"
                      >
                        {item.name}
                      </MenuLink>
                    ) : (
                      <p className="py-2.5 min-h-[44px] text-base font-semibold text-slate-900">{item.name}</p>
                    )}

                    {hasSubItems && sectionOpen ? (
                      <div id={`mobile-section-${sectionKey}`} className="pt-2 pb-3 pl-4 border-l-2 border-brand-red-200">
                        {item.href ? (
                          <MenuLink
                            href={item.href}
                            onNavigate={closeMenu}
                            className="block py-1.5 min-h-[40px] text-sm font-bold text-brand-red-600 hover:text-brand-red-700"
                          >
                            View all {item.name} →
                          </MenuLink>
                        ) : null}

                        {useCategoryAccordions
                          ? columns
                              .filter((column) => column.some((entry) => !entry?.isHeader))
                              .map((column, columnIndex) => {
                                const categoryKey = `${sectionKey}::${columnIndex}`;
                                const categoryOpen = expandedCategory === categoryKey;
                                const label = getNavCategoryLabel(column);
                                const categoryHeader = column.find((entry) => entry.isHeader);

                                return (
                                  <div key={categoryKey} className="mt-1 first:mt-0">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedCategory(categoryOpen ? null : categoryKey)}
                                      className="flex w-full min-h-[40px] items-center justify-between py-1 text-xs font-bold uppercase tracking-wide text-brand-red-600 hover:text-brand-red-700"
                                      aria-label={`${categoryOpen ? 'Collapse' : 'Expand'} ${label}`}
                                      aria-expanded={categoryOpen}
                                    >
                                      <span className="break-words leading-tight text-left">{label}</span>
                                      <ChevronDown
                                        className={`h-3.5 w-3.5 flex-none text-brand-red-400 transition-transform duration-200 ml-2 ${categoryOpen ? 'rotate-180' : ''}`}
                                        aria-hidden="true"
                                      />
                                    </button>

                                    {categoryOpen ? (
                                      <div className="pl-3 border-l border-brand-red-200">
                                        {categoryHeader?.href ? (
                                          <MenuLink
                                            href={categoryHeader.href}
                                            onNavigate={closeMenu}
                                            className="block py-1 min-h-[32px] text-xs font-bold uppercase tracking-wide text-brand-red-600 hover:text-brand-red-700"
                                          >
                                            {categoryHeader.name.replace(/—/g, '').trim()}
                                          </MenuLink>
                                        ) : null}
                                        {column.map((subItem) =>
                                          subItem.isHeader ? null : (
                                            <MobileSubLink
                                              key={`${subItem.name}-${subItem.href ?? 'nohref'}`}
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
                                subItem.href ? (
                                  <MenuLink
                                    key={`${subItem.name}-${subItem.href}`}
                                    href={subItem.href}
                                    onNavigate={closeMenu}
                                    className="block py-2 text-xs font-bold uppercase tracking-wide text-brand-red-600 hover:text-brand-red-700"
                                  >
                                    {subItem.name.replace(/—/g, '').trim()}
                                  </MenuLink>
                                ) : (
                                  <p key={subItem.name} className="pt-2 pb-0.5 text-xs font-bold uppercase tracking-wide text-brand-red-600 break-words">
                                    {subItem.name.replace(/—/g, '').trim()}
                                  </p>
                                )
                              ) : (
                                <MobileSubLink
                                  key={`${subItem.name}-${subItem.href ?? 'nohref'}`}
                                  subItem={subItem}
                                  itemId={item.id}
                                  programApplyLinks={programApplyLinks}
                                  onNavigate={closeMenu}
                                />
                              ),
                            )}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 p-4 bg-white shrink-0 pb-[env(safe-area-inset-bottom)]">
              <div className="flex gap-2 mb-3">
                <MenuLink
                  href={ROUTES.apply}
                  onNavigate={closeMenu}
                  className="flex-1 flex items-center justify-center py-3 min-h-[44px] bg-brand-red-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-red-700"
                >
                  Apply Now
                </MenuLink>
                <MenuLink
                  href={ROUTES.login}
                  onNavigate={closeMenu}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 min-h-[44px] border border-slate-300 text-slate-800 rounded-lg font-semibold text-sm hover:bg-slate-50"
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Sign In
                </MenuLink>
              </div>
              <a
                href={phoneHref(siteUrls.org.phone)}
                className="flex items-center justify-center gap-1.5 py-3 min-h-[44px] text-sm font-medium text-slate-500 hover:text-brand-blue-600"
              >
                <Phone className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {siteUrls.org.phone}
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
      <LanguageSwitcher compact />
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-site-navigation"
      >
        {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>
      {drawer}
    </div>
  );
}
