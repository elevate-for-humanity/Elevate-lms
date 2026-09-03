'use client';

/**
 * PortalShell — Unified dashboard shell for all portals.
 *
 * Used by: staff-portal, employer, workforce-board, instructor, program-holder, mentor
 *
 * Provides:
 *   - Consistent sidebar nav with role-aware items
 *   - Mobile-responsive hamburger menu
 *   - Unified header with user avatar + logout
 *   - Breadcrumb slot
 *   - Notification badge support
 *
 * Usage:
 *   <PortalShell nav={NAV_ITEMS} portalName="Staff Portal" role="staff">
 *     {children}
 *   </PortalShell>
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut, Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PortalNavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: PortalNavItem[];
}

interface PortalShellProps {
  children: React.ReactNode;
  nav: PortalNavItem[];
  portalName: string;
  role?: string;
  userEmail?: string;
  userName?: string;
  logoHref?: string;
  notificationCount?: number;
}

export function PortalShell({
  children,
  nav,
  portalName,
  userEmail,
  userName,
  logoHref = '/',
  notificationCount = 0,
}: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white/95 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:flex',
        )}
      >
        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <Link href={logoHref} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-red-600 to-orange-500 text-sm font-black text-white shadow-md">
              E
            </span>
            <span>
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                Elevate
              </span>
              <span className="block text-sm font-black text-slate-900">{portalName}</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label={`${portalName} navigation`}>
          {nav.map((item) => (
            <NavItem key={item.href} item={item} isActive={isActive} depth={0} />
          ))}
        </nav>

        {/* User footer */}
        {(userName || userEmail) && (
          <div className="border-t border-slate-100 p-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-blue-100 flex items-center justify-center text-brand-blue-700 font-semibold text-sm shrink-0">
                {(userName ?? userEmail ?? '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                {userName && (
                  <p className="text-xs font-medium text-slate-900 truncate">{userName}</p>
                )}
                {userEmail && <p className="text-xs text-slate-500 truncate">{userEmail}</p>}
              </div>
              <Link
                href="/api/auth/signout"
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-20 shrink-0 items-center gap-4 border-b border-slate-200/80 bg-white/85 px-4 shadow-sm backdrop-blur-xl lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          {notificationCount > 0 && (
            <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-transparent">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  item,
  isActive,
  depth,
}: {
  item: PortalNavItem;
  isActive: (href: string) => boolean;
  depth: number;
}) {
  const [open, setOpen] = useState(false);
  const active = isActive(item.href);
  const Icon = item.icon;

  if (item.children?.length) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'mb-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
            active
              ? 'bg-blue-50 text-brand-blue-700 font-bold shadow-sm ring-1 ring-blue-100'
              : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950',
          )}
        >
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-90')} />
        </button>
        {open && (
          <div className="ml-4 border-l border-slate-100 pl-2 mb-1">
            {item.children.map((child) => (
              <NavItem key={child.href} item={child} isActive={isActive} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'mb-1 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
        active
          ? 'bg-blue-50 text-brand-blue-700 font-bold shadow-sm ring-1 ring-blue-100'
          : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950',
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="flex-1">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="ml-auto bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
