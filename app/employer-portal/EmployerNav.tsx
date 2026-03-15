'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Briefcase, FileText, Users, BarChart3,
  MessageSquare, BookOpen, Settings, Building2, TrendingUp,
} from 'lucide-react';

const items = [
  { href: '/employer-portal', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employer-portal/jobs', label: 'Job Postings', icon: Briefcase },
  { href: '/employer-portal/applications', label: 'Applications', icon: FileText },
  { href: '/employer-portal/candidates', label: 'Candidates', icon: Users },
  { href: '/employer-portal/interviews', label: 'Interviews', icon: MessageSquare },
  { href: '/employer-portal/programs', label: 'Programs', icon: BookOpen },
  { href: '/employer-portal/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/employer-portal/wotc', label: 'WOTC Credits', icon: TrendingUp },
  { href: '/employer-portal/company', label: 'Company Profile', icon: Building2 },
  { href: '/employer-portal/settings', label: 'Settings', icon: Settings },
];

export default function EmployerNav() {
  const pathname = usePathname();

  return (
    <aside>
      <div className="rounded-xl border bg-white p-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-3">Employer</div>
        <nav className="flex flex-col gap-0.5">
          {items.map((i) => {
            const active = pathname === i.href || (i.href !== '/employer-portal' && pathname.startsWith(i.href));
            return (
              <Link key={i.href} href={i.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  active ? 'bg-brand-blue-50 text-brand-blue-700 font-medium' : 'text-gray-700 hover:bg-white'
                }`}>
                <i.icon className="w-4 h-4" />
                {i.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
