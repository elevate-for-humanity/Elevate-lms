'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  LayoutDashboard,
  Award,
  Menu,
  X,
  Calendar,
  MessageSquare,
  TrendingUp,
  ClipboardCheck,
  Settings,
  LogOut,
  ChevronLeft,
  GraduationCap,
  HelpCircle,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';

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
  { href: '/lms/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lms/courses', label: 'My Courses', icon: BookOpen },
  { href: '/lms/progress', label: 'Progress', icon: TrendingUp },
  { href: '/lms/quizzes', label: 'Quizzes', icon: ClipboardCheck },
  { href: '/lms/schedule', label: 'Schedule', icon: Calendar },
  { href: '/lms/messages', label: 'Messages', icon: MessageSquare },
  { href: '/lms/certificates', label: 'Certificates', icon: Award },
];

const bottomItems = [
  { href: '/support/help', label: 'Help Center', icon: HelpCircle },
  { href: '/lms/settings', label: 'Settings', icon: Settings },
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
      : 'U';

  const userName = profile?.full_name ||
    (profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : 'Student');

  const getBadge = (href: string) => {
    if (href === '/lms/courses' && courseCount > 0) return courseCount;
    if (href === '/lms/messages' && unreadMessages > 0) return unreadMessages;
    return undefined;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
        <Link href="/lms/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-blue-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-white text-sm tracking-tight">Elevate LMS</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* User Card */}
      <div className={`px-4 py-4 border-b border-slate-800 ${collapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {userInitials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="LMS navigation">
        <p className={`text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'px-3'}`}>
          {collapsed ? '•••' : 'Learning'}
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const badge = getBadge(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && badge && (
                <span className="ml-auto bg-brand-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className={`text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 ${collapsed ? 'text-center' : 'px-3'}`}>
            {collapsed ? '•••' : 'Support'}
          </p>
          {bottomItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                } ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="px-3 py-3 border-t border-slate-800">
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all w-full ${collapsed ? 'justify-center px-2' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white p-2 -ml-2"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link href="/lms/dashboard" className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-brand-blue-400" />
          <span className="font-bold text-white text-sm">Elevate LMS</span>
        </Link>
        <NotificationBell />
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-slate-900 z-50 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-3 right-3">
          <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 left-0 bottom-0 bg-slate-900 border-r border-slate-800 z-40 transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
