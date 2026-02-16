'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Info, Home, Users, GraduationCap, FileText, Building2, 
  Shield, BarChart3, ClipboardList, DollarSign, ScrollText,
  Briefcase, UserCheck, Award, FileCheck, Menu, X,
  BookOpen, Clock, Trophy
} from 'lucide-react';
import { useState } from 'react';

interface DemoPageShellProps {
  title: string;
  description: string;
  portal?: 'admin' | 'employer' | 'learner';
  children?: React.ReactNode;
}

const adminNav = [
  { href: '/demo/admin', label: 'Dashboard', icon: Home },
  { href: '/demo/admin/applications', label: 'Applications', icon: ClipboardList },
  { href: '/demo/admin/enrollments', label: 'Enrollments', icon: Users },
  { href: '/demo/admin/compliance', label: 'Compliance', icon: Shield },
  { href: '/demo/admin/funding', label: 'Funding', icon: DollarSign },
  { href: '/demo/admin/outcomes', label: 'Outcomes', icon: BarChart3 },
  { href: '/demo/admin/partners', label: 'Partners', icon: Building2 },
  { href: '/demo/admin/reports', label: 'Reports', icon: FileText },
  { href: '/demo/admin/wioa', label: 'WIOA', icon: ScrollText },
  { href: '/demo/admin/audit-logs', label: 'Audit Logs', icon: FileCheck },
];

const employerNav = [
  { href: '/demo/employer', label: 'Dashboard', icon: Home },
  { href: '/demo/employer/candidates', label: 'Candidates', icon: UserCheck },
  { href: '/demo/employer/apprenticeships', label: 'Apprenticeships', icon: GraduationCap },
  { href: '/demo/employer/incentives', label: 'Incentives', icon: Award },
  { href: '/demo/employer/documents', label: 'Documents', icon: FileText },
];

const learnerNav = [
  { href: '/demo/learner', label: 'My Dashboard', icon: Home },
  { href: '/demo/learner/courses', label: 'Courses', icon: BookOpen },
  { href: '/demo/learner/hours', label: 'Hours', icon: Clock },
  { href: '/demo/learner/certificates', label: 'Certificates', icon: Trophy },
];

export function DemoPageShell({ title, description, portal = 'admin', children }: DemoPageShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = portal === 'employer' ? employerNav : portal === 'learner' ? learnerNav : adminNav;
  const portalLabel = portal === 'employer' ? 'Employer Portal' : portal === 'learner' ? 'Student Portal' : 'Admin Portal';
  const portalColor = portal === 'employer' ? 'bg-brand-blue-600' : portal === 'learner' ? 'bg-green-600' : 'bg-slate-800';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo banner */}
      <div className="bg-amber-500 text-white text-center py-2 px-4 text-xs font-medium flex items-center justify-center gap-2">
        <Info className="w-3.5 h-3.5" />
        <span>Interactive Demo — Sample data, click through every section</span>
        <Link href="/store/demos" className="underline ml-2">Back to demos</Link>
      </div>

      {/* Top header */}
      <header className={`${portalColor} text-white sticky top-0 z-40`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1">
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/demo/admin" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Elevate" width={28} height={28} />
              <span className="font-bold text-sm">{portalLabel}</span>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/store/demos" className="hidden sm:block opacity-80 hover:opacity-100">All Demos</Link>
            <Link href="/store/trial" className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg font-semibold">
              Start Trial
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-[88px] left-0 z-30 h-[calc(100vh-88px)] w-56 bg-white border-r overflow-y-auto
          transition-transform lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="py-2">
            {nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-red-50 text-red-700 font-semibold border-r-2 border-red-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Portal switcher */}
          <div className="border-t mt-2 pt-2 px-3 pb-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-1">Switch Portal</p>
            {[
              { href: '/demo/admin', label: 'Admin', active: portal === 'admin' },
              { href: '/demo/employer', label: 'Employer', active: portal === 'employer' },
              { href: '/demo/learner', label: 'Student', active: portal === 'learner' },
            ].map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className={`block px-3 py-1.5 rounded text-xs font-medium ${
                  p.active ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 py-4 border-b bg-white animate-fade-in-up">
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <div className="p-4 sm:p-6 max-w-6xl animate-fade-in-up delay-100">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
