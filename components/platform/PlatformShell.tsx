'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type {
  UserRole,
  NavSection,
  BreadcrumbItem,
  ActionItem,
} from '@/lib/navigation/navigation-config';
import {
  getNavigationForRole,
  ROLE_DISPLAY_NAMES,
} from '@/lib/navigation/navigation-config';

interface PlatformShellProps {
  user: {
    id: string;
    email: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  role: UserRole;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ActionItem[];
  notifications?: number;
  children: React.ReactNode;
}

function isActiveHref(href: string, pathname: string): boolean {
  try {
    const url = new URL(href, 'https://local.invalid');
    return pathname === url.pathname || pathname.startsWith(`${url.pathname}/`);
  } catch {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
}

export function PlatformShell({
  user,
  role,
  actions = [],
  children,
}: PlatformShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  const baseSections = getNavigationForRole(role);
  const sections = role === 'program_holder'
    ? baseSections.map((section) => ({
        ...section,
        items: [
          ...section.items,
          { id: 'at-risk', label: 'At-Risk Students', href: '/program-holder/students/at-risk', icon: Users },
          { id: 'onboarding', label: 'Onboarding', href: '/program-holder/onboarding', icon: ShieldCheck },
          { id: 'agreement', label: 'MOU & Agreement', href: '/program-holder/rights-responsibilities', icon: ShieldCheck },
        ],
      }))
    : baseSections;

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key !== 'Tab' || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  const userInitials =
    user.first_name && user.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`
      : user.full_name
        ? user.full_name
            .split(' ')
            .map((name) => name[0])
            .join('')
            .slice(0, 2)
        : 'U';

  const userName =
    user.full_name ||
    (user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : 'User');

  return (
    <div className="min-h-dvh w-full overflow-x-clip bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-16 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="hidden min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
              aria-label="Open portal navigation"
              aria-expanded={sidebarOpen}
              aria-controls="portal-navigation-drawer"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-red-600 shadow-sm">
                <span className="text-sm font-black text-white">E</span>
              </div>
              <div className="hidden min-w-0 md:block">
                <span className="block truncate font-black text-slate-950">{ROLE_DISPLAY_NAMES[role]}</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3 w-3 shrink-0" /> Secure role-restricted session
                </span>
              </div>
            </Link>
          </div>

          <div className="mx-8 hidden max-w-md flex-1 md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search your portal..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-medium text-slate-950 transition-all placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-brand-blue-500"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {actions.length > 0 && (
              <div className="mr-4 hidden items-center gap-2 lg:flex">
                {actions.slice(0, 2).map((action) =>
                  action.href ? (
                    <Link
                      key={action.id}
                      href={action.href}
                      className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                        action.variant === 'primary'
                          ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {action.icon && <action.icon className="h-4 w-4" />}
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      key={action.id}
                      type="button"
                      onClick={action.onClick}
                      className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                        action.variant === 'primary'
                          ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {action.icon && <action.icon className="h-4 w-4" />}
                      {action.label}
                    </button>
                  ),
                )}
              </div>
            )}

            <div className="group relative">
              <button
                type="button"
                className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500"
                aria-label="Open account menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue-600 text-sm font-black text-white">
                  {userInitials}
                </div>
                <ChevronDown className="hidden h-4 w-4 text-slate-500 lg:block" />
              </button>

              <div className="invisible absolute right-0 z-[80] mt-2 w-[min(16rem,calc(100vw-1rem))] rounded-xl border border-slate-200 bg-white py-2 opacity-0 shadow-xl transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="font-bold text-slate-950">{userName}</p>
                  <p className="truncate text-sm text-slate-600">{user.email}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> Authenticated with Supabase
                  </p>
                </div>
                <form action="/api/auth/signout" method="post">
                  <button type="submit" className="flex min-h-11 w-full items-center gap-2 px-4 py-2 text-left font-bold text-red-700 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Sign out securely
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
        <nav
          aria-label={`${ROLE_DISPLAY_NAMES[role]} mobile navigation`}
          className="flex max-w-full gap-2 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
        >
          {sections.flatMap((section) => section.items).map((item) => {
            const Icon = item.icon;
            const active = isActiveHref(item.href, pathname);
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-bold ${
                  active ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex min-w-0">
        {false && sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-[60] cursor-default bg-black/60 backdrop-blur-[1px] lg:hidden"
            onClick={() => {
              setSidebarOpen(false);
              menuButtonRef.current?.focus();
            }}
            aria-label="Close portal navigation"
          />
        )}

        <aside
          ref={drawerRef}
          id="portal-navigation-drawer"
          role={sidebarOpen ? 'dialog' : undefined}
          aria-modal={sidebarOpen ? true : undefined}
          aria-label={`${ROLE_DISPLAY_NAMES[role]} navigation`}
          className={`hidden bg-slate-950 text-white lg:sticky lg:top-16 lg:z-20 lg:block lg:h-[calc(100dvh-4rem)] lg:w-64 lg:shrink-0 lg:shadow-none ${
            sidebarOpen
              ? 'translate-x-0 visible pointer-events-auto'
              : '-translate-x-full invisible pointer-events-none lg:visible lg:pointer-events-auto'
          }`}
        >
          <div className="flex h-full min-h-0 flex-col pt-[env(safe-area-inset-top)] lg:pt-0">
            <div className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-800 p-4">
              <div className="min-w-0">
                <h2 className="truncate text-xs font-black uppercase tracking-wider text-slate-300">
                  {ROLE_DISPLAY_NAMES[role]}
                </h2>
                <p className="mt-1 text-xs text-slate-400">Use this menu to move through your workspace.</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  menuButtonRef.current?.focus();
                }}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-slate-200 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:hidden"
                aria-label="Close portal navigation"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4 pb-[max(1rem,env(safe-area-inset-bottom))]" aria-label={`${ROLE_DISPLAY_NAMES[role]} navigation links`}>
              {sections.map((section) => (
                <div key={section.id} className="mb-4">
                  {section.label && (
                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {section.label}
                    </div>
                  )}
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveHref(item.href, pathname);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`mx-2 flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                          active
                            ? 'bg-brand-blue-600 text-white shadow-sm'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="shrink-0 rounded-full bg-brand-red-600 px-2 py-0.5 text-xs">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="hidden shrink-0 border-t border-slate-800 p-4 sm:block">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-100">
                <div className="flex items-center gap-2 font-black"><ShieldCheck className="h-4 w-4" /> Secure workspace</div>
                <p className="mt-1 leading-5 text-emerald-100/90">Your session is authenticated and portal access is role-restricted.</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 w-full flex-1 overflow-x-clip">
          <div className="min-w-0 max-w-full overflow-x-auto break-words p-3 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export type { UserRole, NavSection, BreadcrumbItem, ActionItem } from '@/lib/navigation/navigation-config';
