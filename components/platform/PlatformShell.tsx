'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Search,
  Menu,
  ChevronDown,
  LogOut,
  Settings,
  User,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import type {
  UserRole,
  NavSection,
  BreadcrumbItem,
  ActionItem,
} from '@/lib/navigation/navigation-config';
import {
  getNavigationForRole,
  generateBreadcrumbs,
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
  breadcrumbs,
  actions = [],
  notifications = 0,
  children,
}: PlatformShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sections = getNavigationForRole(role);
  const autoBreadcrumbs = breadcrumbs || generateBreadcrumbs(pathname);

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
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 transition-colors hover:bg-slate-100 lg:hidden"
              aria-label="Toggle portal navigation"
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-red-600 shadow-sm">
                <span className="text-sm font-black text-white">E</span>
              </div>
              <div className="hidden md:block">
                <span className="block font-black text-slate-950">{ROLE_DISPLAY_NAMES[role]}</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" /> Secure role-restricted session
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

          <div className="flex items-center gap-2">
            {actions.length > 0 && (
              <div className="mr-4 hidden items-center gap-2 lg:flex">
                {actions.slice(0, 2).map((action) =>
                  action.href ? (
                    <Link
                      key={action.id}
                      href={action.href}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
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
                      onClick={action.onClick}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
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

            <Link
              href="/notifications"
              className="relative rounded-lg p-2 transition-colors hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-slate-700" />
              {notifications > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-red-600 text-xs text-white">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Link>

            <div className="group relative">
              <button className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-slate-100" aria-label="Open account menu">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue-600 text-sm font-black text-white">
                  {userInitials}
                </div>
                <ChevronDown className="hidden h-4 w-4 text-slate-500 lg:block" />
              </button>

              <div className="invisible absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white py-2 opacity-0 shadow-xl transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="font-bold text-slate-950">{userName}</p>
                  <p className="truncate text-sm text-slate-600">{user.email}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> Authenticated with Supabase
                  </p>
                </div>
                <Link href="/profile" className="flex items-center gap-2 px-4 py-2 font-medium text-slate-800 hover:bg-slate-50">
                  <User className="h-4 w-4" /> Profile
                </Link>
                <Link href="/settings" className="flex items-center gap-2 px-4 py-2 font-medium text-slate-800 hover:bg-slate-50">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
                <hr className="my-2 border-slate-100" />
                <form action="/api/auth/signout" method="post">
                  <button type="submit" className="flex w-full items-center gap-2 px-4 py-2 text-left font-bold text-red-700 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Sign out securely
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {autoBreadcrumbs.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
            <nav className="mx-auto flex max-w-7xl items-center gap-2 text-sm" aria-label="Breadcrumb">
              <Link href="/" className="font-medium text-slate-600 hover:text-slate-900">Home</Link>
              {autoBreadcrumbs.map((crumb, index) => (
                <React.Fragment key={`${crumb.label}-${index}`}>
                  <span className="text-slate-300">/</span>
                  {crumb.href && index < autoBreadcrumbs.length - 1 ? (
                    <Link href={crumb.href} className="font-medium text-slate-600 hover:text-slate-900">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-bold text-slate-950">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="flex">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-950 text-white transition-transform duration-200 ease-in-out lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:shrink-0 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-800 p-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-300">
                {ROLE_DISPLAY_NAMES[role]}
              </h2>
              <p className="mt-1 text-xs text-slate-400">Use this menu to move through your workspace.</p>
            </div>

            <nav className="flex-1 overflow-y-auto py-4" aria-label={`${ROLE_DISPLAY_NAMES[role]} navigation`}>
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
                        className={`mx-2 flex items-center gap-3 rounded-lg px-4 py-2.5 font-semibold transition-colors ${
                          active
                            ? 'bg-brand-blue-600 text-white shadow-sm'
                            : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="rounded-full bg-brand-red-600 px-2 py-0.5 text-xs">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="space-y-1 border-t border-slate-800 p-4">
              <div className="mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-100">
                <div className="flex items-center gap-2 font-black"><ShieldCheck className="h-4 w-4" /> Secure workspace</div>
                <p className="mt-1 leading-5 text-emerald-100/90">Your session is authenticated and portal access is role-restricted.</p>
              </div>
              <Link href="/support" className="flex items-center gap-2 py-2 text-sm font-medium text-slate-300 hover:text-white">
                <Bell className="h-4 w-4" /> Support
              </Link>
              <Link href="/help" className="flex items-center gap-2 py-2 text-sm font-medium text-slate-300 hover:text-white">
                <ExternalLink className="h-4 w-4" /> Help Center
              </Link>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="p-4 lg:p-6">
            {mounted ? (
              children
            ) : (
              <div className="animate-pulse space-y-4">
                <div className="h-8 w-1/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="h-32 rounded bg-slate-200" />
                  <div className="h-32 rounded bg-slate-200" />
                  <div className="h-32 rounded bg-slate-200" />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export type { UserRole, NavSection, BreadcrumbItem, ActionItem } from '@/lib/navigation/navigation-config';
