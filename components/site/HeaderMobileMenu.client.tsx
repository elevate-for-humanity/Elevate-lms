'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Menu, X, Lock, Phone, GraduationCap, Building2, Landmark, FlaskConical } from 'lucide-react';
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
  const programSlug = itemId === 'programs' ? getProgramSlugFromHref(href) : null;
  const applyHref = programSlug ? programApplyLinks[programSlug] : undefined;

  return (
    <div>
      <MenuLink
        href={href}
        onNavigate={onNavigate}
        className={`flex min-h-[40px] items-center gap-1.5 py-2 text-sm hover:text-brand-blue-600 ${
          subItem.isSectionLink ? 'font-semibold text-slate-800' : 'text-slate-700'
        }`}
      >
        {subItem.isAuth && <Lock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" aria-hidden="true" />}
        <span className="break-words">{subItem.name}</span>
      </MenuLink>
      {applyHref ? (
        <MenuLink
          href={applyHref}
          onNavigate={onNavigate}
          className="block min-h-[32px] py-1.5 pl-6 text-xs font-medium text-brand-blue-700 hover:underline"
        >
          Apply to {subItem.name}
        </MenuLink>
      ) : null}
    </div>
  );
}

const ENTRY_POINTS = [
  { label: 'Student / Applicant', href: ROUTES.apply, icon: GraduationCap },
  { label: 'Employer', href: ROUTES.employers, icon: Building2 },
  { label: 'Workforce Agency', href: ROUTES.forAgencies, icon: Landmark },
  { label: 'Testing Center', href: ROUTES.testing, icon: FlaskConical },
] as const;

export default function HeaderMobileMenu({ items, programApplyLinks = {} }: HeaderMobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const pathname = usePathname();
  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => firstFocusRef.current?.focus());
    } else {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      return;
    }

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const drawer = isOpen
    ? createPortal(
        <div className="fixed inset-0 z-[10000] bg-slate-950/50 lg:hidden">
          <button
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={closeMenu}
            aria-label="Close navigation"
          />

          <div
            id="mobile-site-navigation"
            className="absolute inset-y-0 right-0 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:w-[min(100vw,26rem)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
          >
            <div className="flex min-h-[60px] shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 pt-[env(safe-area-inset-top)]">
              <h2 className="text-base font-semibold text-slate-900" id="mobile-nav-title">Menu</h2>
              <button
                ref={firstFocusRef}
                type="button"
                onClick={closeMenu}
                aria-label="Close navigation"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="shrink-0 border-b border-slate-100 bg-slate-50 px-3 py-3">
              <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">Choose your entry point</p>
              <div className="grid grid-cols-2 gap-2">
                {ENTRY_POINTS.map(({ label, href, icon: Icon }) => (
                  <MenuLink
                    key={label}
                    href={href}
                    onNavigate={closeMenu}
                    className="flex min-h-[52px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:border-brand-blue-300 hover:text-brand-blue-700"
                  >
                    <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
                    <span>{label}</span>
                  </MenuLink>
                ))}
              </div>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white px-3 py-2" aria-label="Site navigation">
              {items.map((item) => {
                const sectionKey = item.id ?? item.name;
                const hasSubItems = Boolean(item.subItems?.length);
                const sectionOpen = expandedSection === sectionKey;
                const groups = hasSubItems ? Object.values(groupNavSubItemsByHeader(item.subItems!)) : [];
                const useCategoryAccordions = groups.length > 1;
                const hasChildWithParentHref = Boolean(
                  item.href && item.subItems?.some((subItem) => subItem.href === item.href),
                );

                return (
                  <section key={sectionKey} className="border-b border-slate-100 last:border-0">
                    {hasSubItems ? (
                      <button
                        type="button"
                        onClick={() => toggleSection(sectionKey)}
                        className="flex min-h-[48px] w-full items-center justify-between py-3 text-left text-base font-semibold text-slate-900 hover:text-brand-blue-600"
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
                        className="flex min-h-[48px] items-center py-3 text-base font-semibold text-slate-900 hover:text-brand-blue-600"
                      >
                        {item.name}
                      </MenuLink>
                    ) : null}

                    {hasSubItems && sectionOpen ? (
                      <div id={`mobile-section-${sectionKey}`} className="border-l-2 border-brand-red-200 pb-3 pl-4 pt-1">
                        {item.href && !hasChildWithParentHref ? (
                          <MenuLink
                            href={item.href}
                            onNavigate={closeMenu}
                            className="block min-h-[40px] py-2 text-sm font-bold text-brand-red-600 hover:text-brand-red-700"
                          >
                            View all {item.name} →
                          </MenuLink>
                        ) : null}

                        {useCategoryAccordions
                          ? groups
                              .filter((group) => group.some((entry) => !entry?.isHeader))
                              .map((group, groupIndex) => {
                                const categoryKey = `${sectionKey}::${groupIndex}`;
                                const categoryOpen = expandedCategory === categoryKey;
                                const label = getNavCategoryLabel(group);
                                const categoryHeader = group.find((entry) => entry.isHeader);

                                if (!label) {
                                  return (
                                    <div key={categoryKey}>
                                      {group.map((subItem) =>
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
                                  );
                                }

                                return (
                                  <div key={categoryKey} className="mt-1 first:mt-0">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedCategory(categoryOpen ? null : categoryKey)}
                                      className="flex min-h-[40px] w-full items-center justify-between py-1 text-xs font-bold uppercase tracking-wide text-brand-red-600 hover:text-brand-red-700"
                                      aria-expanded={categoryOpen}
                                    >
                                      <span className="break-words text-left leading-tight">{label}</span>
                                      <ChevronDown
                                        className={`ml-2 h-3.5 w-3.5 flex-none text-brand-red-400 transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`}
                                        aria-hidden="true"
                                      />
                                    </button>

                                    {categoryOpen ? (
                                      <div className="border-l border-brand-red-200 pl-3">
                                        {categoryHeader?.href ? (
                                          <MenuLink
                                            href={categoryHeader.href}
                                            onNavigate={closeMenu}
                                            className="block min-h-[32px] py-1 text-xs font-bold uppercase tracking-wide text-brand-red-600 hover:text-brand-red-700"
                                          >
                                            {categoryHeader.name.replace(/—/g, '').trim()}
                                          </MenuLink>
                                        ) : null}
                                        {group.map((subItem) =>
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
                                  <p key={subItem.name} className="pb-0.5 pt-2 text-xs font-bold uppercase tracking-wide text-brand-red-600">
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

            <div className="shrink-0 border-t border-slate-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="mb-3 flex gap-2">
                <MenuLink
                  href={ROUTES.apply}
                  onNavigate={closeMenu}
                  className="flex min-h-[44px] flex-1 items-center justify-center rounded-lg bg-brand-red-600 py-3 text-sm font-semibold text-white hover:bg-brand-red-700"
                >
                  Apply Now
                </MenuLink>
                <MenuLink
                  href={ROUTES.login}
                  onNavigate={closeMenu}
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Sign In
                </MenuLink>
              </div>
              <a
                href={phoneHref(siteUrls.org.phone)}
                className="flex min-h-[44px] items-center justify-center gap-1.5 py-3 text-sm font-medium text-slate-500 hover:text-brand-blue-600"
              >
                <Phone className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                {siteUrls.org.phone}
              </a>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="flex shrink-0 flex-row flex-nowrap items-center justify-end gap-0.5">
      <SearchModal />
      <LanguageSwitcher compact />
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
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
