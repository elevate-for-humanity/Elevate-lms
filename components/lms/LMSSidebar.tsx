'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen, LayoutDashboard, Award, Menu, X, Calendar,
  MessageSquare, TrendingUp, ClipboardCheck, Settings,
  LogOut, ChevronLeft, GraduationCap, HelpCircle,
  Play, Target, Users, ChevronRight,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { createClient } from '@/lib/supabase/client';

interface LMSSidebarProps {
  user: { id: string; email?: string };
  profile: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    role?: string;
  } | null;
  courseCount?: number;
  unreadMessages?: number;
}

const navItems = [
  { href: '/lms/dashboard',        label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/lms/courses',          label: 'My Courses',     icon: BookOpen },
  { href: '/lms/assignments',      label: 'Assignments',    icon: Target },
  { href: '/lms/progress',         label: 'Progress',       icon: TrendingUp },
  { href: '/lms/quizzes',          label: 'Quizzes',        icon: ClipboardCheck },
  { href: '/lms/calendar',         label: 'Schedule',       icon: Calendar },
  { href: '/lms/attendance',       label: 'Attendance',     icon: ClipboardCheck },
  { href: '/lms/messages',         label: 'Messages',       icon: MessageSquare },
  { href: '/lms/chat',             label: 'Chat',           icon: MessageSquare },
  { href: '/lms/certificates',     label: 'Certificates',   icon: Award },
  { href: '/lms/certification',    label: 'Certification',  icon: Award },
  { href: '/lms/ai-tutor',         label: 'AI Tutor',       icon: BookOpen },
  { href: '/lms/library',          label: 'Library',        icon: BookOpen },
  { href: '/lms/social',           label: 'Community',      icon: Users },
  { href: '/lms/alumni',           label: 'Alumni',         icon: Users },
  { href: '/lms/payments',         label: 'Payments',       icon: Award },
];

const bottomItems = [
  { href: '/lms/support',  label: 'Get Help',  icon: HelpCircle },
  { href: '/lms/settings', label: 'Settings',  icon: Settings },
];

export function LMSSidebar({ user, profile, courseCount = 0, unreadMessages = 0 }: LMSSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/');

  const userInitials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : profile?.full_name
      ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
      : (user.email?.[0] ?? 'U').toUpperCase();

  const userName = profile?.full_name ||
    (profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : user.email?.split('@')[0] ?? 'Student');

  const getBadge = (href: string) => {
    if (href === '/lms/courses' && courseCount > 0) return courseCount;
    if (href === '/lms/messages' && unreadMessages > 0) return unreadMessages;
    return undefined;
  };

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">

      {/* Brand */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800 flex-shrink-0">
        <Link href="/lms/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 bg-brand-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-black text-white text-sm tracking-tight truncate">Elevate LMS</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors flex-shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* User card */}
      <div className={`px-4 py-4 border-b border-slate-800 flex-shrink-0 ${collapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={userName}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-700" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-blue-600 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
              {userInitials}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{profile?.role ?? 'Student'}</p>
            </div>
          )}
          {!collapsed && (
            <div className="flex-shrink-0">
              <NotificationBell />
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const badge = getBadge(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? 'bg-brand-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{label}</span>
                  {badge !== undefined && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      active ? 'bg-white/20 text-white' : 'bg-brand-blue-600 text-white'
                    }`}>
                      {badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom items */}
      <div className="px-2 py-3 border-t border-slate-800 space-y-0.5 flex-shrink-0">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all group"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 h-14 flex items-center justify-between px-4">
        <Link href="/lms/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-white text-sm">Elevate LMS</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed top-14 left-0 bottom-0 z-40 w-72 bg-slate-900 transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex flex-col fixed top-0 left-0 bottom-0 z-30 bg-slate-900 border-r border-slate-800 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        {sidebarContent}
      </div>
    </>
  );
}
