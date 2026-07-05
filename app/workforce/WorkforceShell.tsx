'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Briefcase,
  Search,
  FileText,
  Shield,
  HeartHandshake,
  CheckSquare,
  Menu,
  X,
  LogOut,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
}

const NAV: NavItem[] = [
  { href: '/workforce/dashboard',           label: 'Dashboard',           icon: LayoutDashboard, roles: ['workforce_board', 'case_manager', 'admin', 'super_admin', 'staff', 'org_admin'] },
  { href: '/workforce/participants',        label: 'Participants',        icon: Users,           roles: ['workforce_board', 'case_manager', 'admin', 'super_admin', 'staff', 'org_admin'] },
  { href: '/workforce/search',              label: 'Student Search',      icon: Search,          roles: ['case_manager', 'admin', 'super_admin', 'staff'] },
  { href: '/workforce/placements',          label: 'Placements',          icon: Briefcase,       roles: ['workforce_board', 'case_manager', 'admin', 'super_admin', 'staff', 'org_admin'] },
  { href: '/workforce/follow-ups',          label: 'Follow-Ups',          icon: CheckSquare,     roles: ['workforce_board', 'admin', 'super_admin', 'staff', 'org_admin'] },
  { href: '/workforce/eligibility',         label: 'Eligibility',         icon: Shield,          roles: ['workforce_board', 'admin', 'super_admin', 'staff', 'org_admin'] },
  { href: '/workforce/supportive-services', label: 'Supportive Services', icon: HeartHandshake,  roles: ['workforce_board', 'admin', 'super_admin', 'staff', 'org_admin'] },
  { href: '/workforce/reports',             label: 'Reports',             icon: BarChart3,       roles: ['workforce_board', 'case_manager', 'admin', 'super_admin', 'staff', 'org_admin'] },
  { href: '/workforce/wioa-export',         label: 'WIOA Export',         icon: FileText,        roles: ['case_manager', 'workforce_board', 'admin', 'super_admin', 'staff', 'org_admin'] },
];

export default function WorkforceShell({
  children,
  role,
  userName,
  userEmail,
}: {
  children: React.ReactNode;
  role: string;
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/workforce/dashboard" className="text-base font-bold text-brand-blue-700 whitespace-nowrap">
              Workforce Portal
            </Link>
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-blue-50 text-brand-blue-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-slate-700 leading-none">{userName}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 capitalize">{role.replace('_', ' ')}</p>
            </div>
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Link>
            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-blue-50 text-brand-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
