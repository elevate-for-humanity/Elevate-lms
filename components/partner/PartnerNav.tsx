'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Clock, FileText, BarChart3,
  Settings, ClipboardCheck, GraduationCap, Shield, HelpCircle,
} from 'lucide-react';

const items = [
  { href: '/partner-portal', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/partner/hours', label: 'Training Hours', icon: Clock },
  { href: '/partner/attendance', label: 'Attendance', icon: ClipboardCheck },
  { href: '/partner/documents', label: 'Documents', icon: FileText },
  { href: '/partner/reports', label: 'Reports', icon: BarChart3 },
  { href: '/partner/programs/barber', label: 'Programs', icon: GraduationCap },
  { href: '/partner/settings', label: 'Settings', icon: Settings },
];

const adminItems = [
  { href: '/admin/partner-enrollments', label: 'Enrollments', icon: Users },
  { href: '/admin/partner-inquiries', label: 'Inquiries', icon: HelpCircle },
  { href: '/admin/partners', label: 'All Partners', icon: Shield },
];

export default function PartnerNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="space-y-2">
      <div className="rounded-xl border bg-white p-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-3">Partner</div>
        <nav className="flex flex-col gap-0.5">
          {items.map((i) => {
            const active = pathname === i.href || (i.href !== '/partner-portal' && pathname.startsWith(i.href));
            return (
              <Link key={i.href} href={i.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                  active ? 'bg-brand-blue-50 text-brand-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}>
                <i.icon className="w-4 h-4" />
                {i.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {isAdmin && (
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-3">Admin</div>
          <nav className="flex flex-col gap-0.5">
            {adminItems.map((i) => {
              const active = pathname.startsWith(i.href);
              return (
                <Link key={i.href} href={i.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                    active ? 'bg-brand-blue-50 text-brand-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                  }`}>
                  <i.icon className="w-4 h-4" />
                  {i.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </aside>
  );
}
