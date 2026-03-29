'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search, Bell, Settings, LogOut, ExternalLink,
  Users, Inbox, TrendingUp, Award, ChevronDown, Menu,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface StatPill {
  label: string;
  value: string | number;
  icon: React.ElementType;
  href: string;
  alert?: boolean;
}

export default function AdminHeader() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<StatPill[]>([]);
  const [userName, setUserName] = useState('Admin');

  // Derive page title from pathname
  const segment = pathname.split('/').filter(Boolean)[1] || 'dashboard';
  const pageTitle = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      // Get user name
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, first_name')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.first_name) setUserName(profile.first_name);
        else if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);
      }

      // Load key stats — fail silently per stat
      const [studentsRes, appsRes, enrollRes, certsRes] = await Promise.allSettled([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('applications').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'pending', 'in_review']),
        supabase.from('program_enrollments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
      ]);

      const get = (res: PromiseSettledResult<any>) =>
        res.status === 'fulfilled' ? (res.value.count ?? 0) : '—';

      setStats([
        { label: 'Students',     value: get(studentsRes), icon: Users,     href: '/admin/students' },
        { label: 'Applications', value: get(appsRes),     icon: Inbox,     href: '/admin/applications', alert: (get(appsRes) as number) > 0 },
        { label: 'Enrolled',     value: get(enrollRes),   icon: TrendingUp, href: '/admin/enrollments' },
        { label: 'Certificates', value: get(certsRes),    icon: Award,     href: '/admin/certificates' },
      ]);
    }

    load();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) window.location.href = `/admin/students?search=${encodeURIComponent(search.trim())}`;
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-30">

      {/* Hero banner — dark branded strip */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4 px-4 sm:px-6 py-3">

          {/* Page context */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 leading-none mb-0.5">
              Elevate Admin
            </p>
            <h1 className="text-sm font-extrabold text-white leading-tight truncate">{pageTitle}</h1>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search students, applications…"
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-brand-red-500 focus:border-transparent"
              />
            </div>
          </form>

          {/* Notifications */}
          <Link href="/admin/notifications"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Bell className="w-4 h-4" />
          </Link>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-brand-red-600 flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-xs font-semibold text-white">{userName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 py-1 overflow-hidden">
                  <Link href="/admin/settings" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                    <Settings className="w-3.5 h-3.5" /> Settings
                  </Link>
                  <Link href="/" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> View site
                  </Link>
                  <div className="border-t border-slate-700 my-1" />
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stat pills — live counts */}
        {stats.length > 0 && (
          <div className="flex items-center gap-2 px-4 sm:px-6 pb-3 overflow-x-auto">
            {stats.map(({ label, value, icon: Icon, href, alert }) => (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  alert
                    ? 'bg-brand-red-600/20 border border-brand-red-500/40 text-brand-red-300 hover:bg-brand-red-600/30'
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-extrabold">{value}</span>
                <span className="text-slate-500 font-medium">{label}</span>
                {alert && <span className="w-1.5 h-1.5 rounded-full bg-brand-red-400 animate-pulse" />}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
