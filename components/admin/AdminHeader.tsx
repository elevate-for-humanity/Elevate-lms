'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, ChevronDown, Settings, ExternalLink, LogOut } from 'lucide-react';

export default function AdminHeader() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');

  const segment = pathname.split('/').filter(Boolean)[1] || 'dashboard';
  const pageTitle = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

  const subtitles: Record<string, string> = {
    dashboard:    'Manage applications, enrollments, students, and operations',
    applications: 'Review and action incoming applications',
    students:     'Track student progress and status',
    enrollments:  'Manage active and pending enrollments',
    programs:     'Configure programs and curriculum',
    instructors:  'Instructor assignments and performance',
    payments:     'Billing, fees, and financial records',
    reports:      'Analytics, compliance, and exports',
    settings:     'System configuration and preferences',
  };
  const subtitle = subtitles[segment] ?? 'Admin console';

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/admin/students?search=${encodeURIComponent(search.trim())}`;
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-60 h-14 bg-white border-b border-gray-200 z-30 flex items-center px-4 gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-sm font-semibold text-gray-900 leading-tight truncate">{pageTitle}</h1>
        <p className="text-[11px] text-gray-400 leading-tight hidden sm:block truncate">{subtitle}</p>
      </div>

      <form onSubmit={handleSearch} className="hidden md:flex items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students, applications…"
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
        </div>
      </form>

      <Link href="/admin/notifications"
        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title="Notifications">
        <Bell className="w-4 h-4" />
      </Link>

      <div className="relative">
        <button onClick={() => setProfileOpen(v => !v)}
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">A</div>
          <span className="hidden sm:block font-medium">Admin</span>
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>
        {profileOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
              <Link href="/admin/settings" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                <Settings className="w-3.5 h-3.5" /> Settings
              </Link>
              <Link href="/" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
                <ExternalLink className="w-3.5 h-3.5" /> View site
              </Link>
              <div className="border-t border-gray-100 my-1" />
              <Link href="/api/auth/signout" onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
