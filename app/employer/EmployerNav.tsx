'use client';

import Link from 'next/link';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const NAV_LINKS = [
  { href: '/employer/dashboard', label: 'Dashboard' },
  { href: '/employer/candidates', label: 'Candidates' },
  { href: '/employer/jobs', label: 'Jobs' },
  { href: '/employer/post-job', label: 'Post a Job' },
  { href: '/employer/apprenticeships', label: 'Apprenticeships' },
  { href: '/employer/placements', label: 'Placements' },
  { href: '/employer/hours', label: 'Hours' },
  { href: '/employer/compliance', label: 'Compliance' },
  { href: '/employer/analytics', label: 'Analytics' },
  { href: '/employer/reports', label: 'Reports' },
  { href: '/employer/settings', label: 'Settings' },
];

export function EmployerNav() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-screen-xl mx-auto px-4 flex items-center gap-6 h-14 overflow-x-auto">
        <Link
          href="/employer/dashboard"
          className="font-black text-brand-blue-700 whitespace-nowrap shrink-0"
        >
          Employer Portal
        </Link>
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm text-slate-700 hover:text-brand-blue-700 whitespace-nowrap transition-colors"
          >
            {l.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <NotificationBell />
          <Link
            href="/api/auth/signout"
            className="text-sm text-slate-700 hover:text-slate-900 whitespace-nowrap"
          >
            Sign out
          </Link>
        </div>
      </div>
    </nav>
  );
}
