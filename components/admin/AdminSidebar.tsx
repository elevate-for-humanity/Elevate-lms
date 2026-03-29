'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Users, TrendingUp, GraduationCap,
  UserCheck, CreditCard, BarChart3, Settings, Menu, X, ChevronRight,
} from 'lucide-react';

const NAV = [
  { name: 'Dashboard',    href: '/admin/dashboard',   icon: LayoutDashboard },
  { name: 'Applications', href: '/admin/applications', icon: Inbox },
  { name: 'Students',     href: '/admin/students',     icon: Users },
  { name: 'Enrollments',  href: '/admin/enrollments',  icon: TrendingUp },
  { name: 'Programs',     href: '/admin/programs',     icon: GraduationCap },
  { name: 'Instructors',  href: '/admin/instructors',  icon: UserCheck },
  { name: 'Payments',     href: '/admin/payroll',      icon: CreditCard },
  { name: 'Reports',      href: '/admin/reports',      icon: BarChart3 },
  { name: 'Settings',     href: '/admin/settings',     icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));

  const sidebarContent = (
    <nav className="flex flex-col h-full bg-gray-900" aria-label="Admin navigation">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-gray-800">
        <Link href="/admin/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">E</span>
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">Elevate Admin</div>
            <div className="text-gray-500 text-[10px] leading-tight">Operations Console</div>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map(({ name, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{name}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <Link href="/" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
          ← Back to site
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-lg text-gray-400 hover:text-white">
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 h-full shadow-xl">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-60 lg:fixed lg:inset-y-0 z-40">
        {sidebarContent}
      </aside>
    </>
  );
}
