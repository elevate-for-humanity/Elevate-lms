'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Users, TrendingUp, GraduationCap,
  UserCheck, CreditCard, BarChart3, Settings, Menu, X,
  BookOpen, Shield, FileText, Briefcase, Building2,
  Award, ClipboardList, Bell, ChevronDown, ChevronRight,
  Wrench, Globe, HeartHandshake, DollarSign, AlertTriangle,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { name: 'Dashboard',    href: '/admin/dashboard',     icon: LayoutDashboard },
      { name: 'Applications', href: '/admin/applications',  icon: Inbox },
      { name: 'Students',     href: '/admin/students',      icon: Users },
      { name: 'Enrollments',  href: '/admin/enrollments',   icon: TrendingUp },
      { name: 'At-Risk',      href: '/admin/at-risk',       icon: AlertTriangle },
    ],
  },
  {
    label: 'Programs',
    items: [
      { name: 'Programs',     href: '/admin/programs',      icon: GraduationCap },
      { name: 'Curriculum',   href: '/admin/curriculum',    icon: BookOpen },
      { name: 'Courses',      href: '/admin/courses',       icon: ClipboardList },
      { name: 'Instructors',  href: '/admin/instructors',   icon: UserCheck },
      { name: 'Certificates', href: '/admin/certificates',  icon: Award },
    ],
  },
  {
    label: 'Funding & Finance',
    items: [
      { name: 'WIOA',         href: '/admin/wioa',          icon: HeartHandshake },
      { name: 'Funding',      href: '/admin/funding',       icon: DollarSign },
      { name: 'Payments',     href: '/admin/payroll',       icon: CreditCard },
      { name: 'Grants',       href: '/admin/grants',        icon: Briefcase },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { name: 'Documents',    href: '/admin/documents',     icon: FileText },
      { name: 'Compliance',   href: '/admin/compliance',    icon: Shield },
      { name: 'Audit Logs',   href: '/admin/audit-logs',    icon: ClipboardList },
    ],
  },
  {
    label: 'Partners',
    items: [
      { name: 'Employers',    href: '/admin/employers',     icon: Building2 },
      { name: 'Partners',     href: '/admin/partners',      icon: Globe },
      { name: 'Jobs',         href: '/admin/jobs',          icon: Briefcase },
    ],
  },
  {
    label: 'System',
    items: [
      { name: 'Reports',      href: '/admin/reports',       icon: BarChart3 },
      { name: 'Settings',     href: '/admin/settings',      icon: Settings },
      { name: 'Tools',        href: '/admin/advanced-tools',icon: Wrench },
    ],
  },
];

function NavGroup({ group, pathname, onNav }: { group: typeof NAV_GROUPS[0]; pathname: string; onNav: () => void }) {
  const hasActive = group.items.some(i =>
    pathname === i.href || (i.href !== '/admin/dashboard' && pathname.startsWith(i.href))
  );
  const [open, setOpen] = useState(hasActive);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
      >
        {group.label}
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && (
        <div className="space-y-0.5">
          {group.items.map(({ name, href, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={onNav}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-brand-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 font-medium">{name}</span>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-white/60" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <nav className="flex flex-col h-full bg-slate-900" aria-label="Admin navigation">

      {/* Brand */}
      <div className="px-4 py-5 border-b border-slate-800">
        <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="w-9 h-9 bg-brand-red-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white font-extrabold text-sm">E</span>
          </div>
          <div>
            <div className="text-white font-extrabold text-sm leading-tight">Elevate Admin</div>
            <div className="text-slate-500 text-[10px] leading-tight font-medium">Operations Console</div>
          </div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="px-3 py-3 border-b border-slate-800">
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { label: 'Inbox',   href: '/admin/applications', icon: Inbox },
            { label: 'Alerts',  href: '/admin/at-risk',      icon: Bell },
            { label: 'Reports', href: '/admin/reports',      icon: BarChart3 },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex flex-col items-center gap-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_GROUPS.map(group => (
          <NavGroup
            key={group.label}
            group={group}
            pathname={pathname}
            onNav={() => setMobileOpen(false)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-2">
        <Link href="/" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <Globe className="w-3.5 h-3.5" />
          View public site
        </Link>
        <p className="text-[10px] text-slate-700 font-medium">Elevate for Humanity · Admin</p>
      </div>
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 rounded-lg text-slate-400 hover:text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white z-10">
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside className="hidden lg:block lg:w-64 lg:fixed lg:inset-y-0 z-40">
        {sidebarContent}
      </aside>
    </>
  );
}
