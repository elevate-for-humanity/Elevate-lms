'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import {
  Home, Users, GraduationCap, FileText, Building2,
  Shield, BarChart3, ClipboardList, DollarSign, ScrollText,
  UserCheck, Award, FileCheck, Menu, X,
  BookOpen, Clock, Trophy, ChevronRight, ArrowRight,
} from 'lucide-react';
import { useState } from 'react';

interface DemoPageShellProps {
  title: string;
  description: string;
  portal?: 'admin' | 'employer' | 'learner';
  children?: React.ReactNode;
}

const adminNav = [
  { href: '/demo/admin',              label: 'Dashboard',    icon: Home          },
  { href: '/demo/admin/applications', label: 'Applications', icon: ClipboardList },
  { href: '/demo/admin/enrollments',  label: 'Enrollments',  icon: Users         },
  { href: '/demo/admin/compliance',   label: 'Compliance',   icon: Shield        },
  { href: '/demo/admin/funding',      label: 'Funding',      icon: DollarSign    },
  { href: '/demo/admin/outcomes',     label: 'Outcomes',     icon: BarChart3     },
  { href: '/demo/admin/partners',     label: 'Partners',     icon: Building2     },
  { href: '/demo/admin/reports',      label: 'Reports',      icon: FileText      },
  { href: '/demo/admin/wioa',         label: 'WIOA',         icon: ScrollText    },
  { href: '/demo/admin/audit-logs',   label: 'Audit Logs',   icon: FileCheck     },
];

const employerNav = [
  { href: '/demo/employer',                 label: 'Dashboard',       icon: Home          },
  { href: '/demo/employer/candidates',      label: 'Candidates',      icon: UserCheck     },
  { href: '/demo/employer/apprenticeships', label: 'Apprenticeships', icon: GraduationCap },
  { href: '/demo/employer/incentives',      label: 'Incentives',      icon: Award         },
  { href: '/demo/employer/documents',       label: 'Documents',       icon: FileText      },
];

const learnerNav = [
  { href: '/demo/learner',              label: 'My Dashboard', icon: Home     },
  { href: '/demo/learner/courses',      label: 'Courses',      icon: BookOpen },
  { href: '/demo/learner/hours',        label: 'Hours',        icon: Clock    },
  { href: '/demo/learner/certificates', label: 'Certificates', icon: Trophy   },
];

const PORTAL_META = {
  admin:    { label: 'Admin Portal',    badge: 'Admin',    accent: 'bg-brand-red-600',   dot: 'bg-brand-red-500'   },
  employer: { label: 'Employer Portal', badge: 'Employer', accent: 'bg-brand-blue-600',  dot: 'bg-brand-blue-500'  },
  learner:  { label: 'Student Portal',  badge: 'Student',  accent: 'bg-brand-green-600', dot: 'bg-brand-green-500' },
};

export function DemoPageShell({ title, description, portal = 'admin', children }: DemoPageShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav  = portal === 'employer' ? employerNav : portal === 'learner' ? learnerNav : adminNav;
  const meta = PORTAL_META[portal];

  return (
    <div className="min-h-screen bg-white">

      {/* Demo notice */}
      <div className="bg-brand-red-600 text-white text-center py-2 px-4 text-xs font-semibold flex items-center justify-center gap-3">
        <span className="hidden sm:inline">Video Walkthrough — no real data, no account required</span>
        <span className="sm:hidden">Interactive Demo</span>
        <Link href="/store/demos" className="underline underline-offset-2 opacity-90 hover:opacity-100 flex items-center gap-1">
          All Demos <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Header — matches marketing site */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded hover:bg-slate-800 transition"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2.5 group">
              <Logo alt="Elevate" width={30} height={30} className="rounded" />
              <span className="font-extrabold text-sm tracking-tight group-hover:text-brand-red-400 transition">
                Elevate
              </span>
            </Link>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-400 text-xs">
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={`${meta.accent} text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full`}>
                {meta.badge}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-5 text-xs text-slate-400">
              {[
                { href: '/demo/admin',    label: 'Admin'    },
                { href: '/demo/employer', label: 'Employer' },
                { href: '/demo/learner',  label: 'Student'  },
              ].map(p => (
                <Link
                  key={p.href}
                  href={p.href}
                  className={`font-medium hover:text-white transition ${pathname?.startsWith(p.href) ? 'text-white' : ''}`}
                >
                  {p.label}
                </Link>
              ))}
            </div>
            <Link
              href="/store/trial"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition whitespace-nowrap"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">

        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-[88px] left-0 z-30
          h-[calc(100vh-88px)] w-60 bg-white border-r border-slate-200
          overflow-y-auto flex flex-col
          transition-transform duration-200 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}>
          <div className="px-4 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                {meta.label}
              </span>
            </div>
          </div>

          <nav className="flex-1 py-2">
            {nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-red-50 text-brand-red-700 font-semibold border-r-2 border-brand-red-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-red-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-100 p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2 px-1">Switch Portal</p>
            {[
              { href: '/demo/admin',    label: 'Admin Portal',    active: portal === 'admin'    },
              { href: '/demo/employer', label: 'Employer Portal', active: portal === 'employer' },
              { href: '/demo/learner',  label: 'Student Portal',  active: portal === 'learner'  },
            ].map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition mb-0.5 ${
                  p.active ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                {p.label}
                {p.active && <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500" />}
              </Link>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500 mb-3 leading-snug">
              Ready to run this for your organization?
            </p>
            <Link
              href="/store/trial"
              className="block w-full text-center bg-brand-red-600 hover:bg-brand-red-700 text-white text-xs font-bold py-2.5 rounded-lg transition"
            >
              Start 14-Day Free Trial
            </Link>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 min-w-0">
          <div className="bg-white border-b border-slate-200 px-6 py-5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          </div>
          <div className="p-4 sm:p-6 max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
