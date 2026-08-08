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
  Play,
  Target,
  Users,
  FileText,
  Zap,
  Folder,
  Bell,
  Scissors,
  Trophy,
  BriefcaseBusiness,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { createClient } from '@/lib/supabase/client';

const PORTAL_TYPE_TO_PATH: Record<string, string> = {
  barber: '/portal/barber',
  cosmetology: '/portal/cosmetology',
  esthetician: '/portal/esthetician',
  'nail-technician': '/portal/nail-technician',
  culinary: '/portal/culinary',
  electrical: '/portal/electrical',
  plumbing: '/portal/plumbing',
};

interface LMSSidebarProps {
  user: { id: string; email?: string };
  profile: {
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    role?: string;
    portal_type?: string | null;
  } | null;
  courseCount?: number;
  unreadMessages?: number;
}

const learningItems = [
  { href: '/lms/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lms/courses', label: 'My Programs', icon: BookOpen },
  { href: '/lms/progress', label: 'Progress', icon: TrendingUp },
  { href: '/lms/certificates', label: 'Certificates', icon: Award },
  { href: '/lms/grades', label: 'Grades', icon: ClipboardCheck },
  { href: '/lms/learning-paths', label: 'Learning Paths', icon: Play },
];

const practiceItems = [
  { href: '/lms/assignments', label: 'Assignments', icon: Target },
  { href: '/lms/quizzes', label: 'Quizzes', icon: Zap },
  { href: '/lms/peer-review', label: 'Peer Review', icon: Users },
];

// Canonical community surface: one clear entry point plus the engagement tools users expect.
const communityItems = [
  { href: '/lms/community', label: 'Community Feed', icon: MessageSquare },
  { href: '/lms/groups', label: 'Groups', icon: Users },
  { href: '/lms/members', label: 'Members', icon: Users },
  { href: '/lms/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/lms/jobs', label: 'Career Opportunities', icon: BriefcaseBusiness },
  { href: '/lms/messages', label: 'Messages', icon: MessageSquare },
];

const toolItems = [
  { href: '/lms/calendar', label: 'Calendar & Events', icon: Calendar },
  { href: '/lms/files', label: 'Files', icon: Folder },
  { href: '/lms/library', label: 'Library', icon: BookOpen },
  { href: '/lms/notifications', label: 'Notifications', icon: Bell },
  { href: '/lms/payments', label: 'Payments', icon: FileText },
];

const bottomItems = [
  { href: '/lms/support', label: 'PARIS / Get Help', icon: HelpCircle },
  { href: '/lms/settings', label: 'Settings', icon: Settings },
];

export function LMSSidebar({
  user,
  profile,
  courseCount = 0,
  unreadMessages = 0,
}: LMSSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const userInitials =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`
      : profile?.full_name
        ? profile.full_name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
        : (user.email?.[0] ?? 'U').toUpperCase();

  const userName =
    profile?.full_name ||
    (profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : (user.email?.split('@')[0] ?? 'Student'));

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

  const renderItems = (items: typeof learningItems) =>
    items.map(({ href, label, icon: Icon }) => {
      const active = isActive(href);
      const badge = getBadge(href);
      return (
        <Link
          key={href}
          href={href}
          onClick={() => setMobileOpen(false)}
          className={`group mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
            active
              ? 'bg-brand-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Icon
            className={`h-4 w-4 flex-shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-white'}`}
          />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{label}</span>
              {badge !== undefined && (
                <span
                  className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    active ? 'bg-white/20 text-white' : 'bg-brand-blue-600 text-white'
                  }`}
                >
                  {badge}
                </span>
              )}
            </>
          )}
        </Link>
      );
    });

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-800 px-4">
        <Link href="/lms/dashboard" className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-blue-600">
            <GraduationCap aria-label="graduationcap" className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="truncate text-sm font-black tracking-tight text-white">Elevate LMS</span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-800 hover:text-white lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <div className={`flex-shrink-0 border-b border-slate-800 px-4 py-4 ${collapsed ? 'px-2' : ''}`}>
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={userName}
              className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2 ring-slate-700"
            />
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-blue-600 text-sm font-black text-white">
              {userInitials}
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{userName}</p>
              <p className="truncate text-xs capitalize text-slate-400">{profile?.role ?? 'Student'}</p>
            </div>
          )}
          {!collapsed && (
            <div className="flex-shrink-0">
              <NotificationBell />
            </div>
          )}
        </div>
      </div>

      <nav aria-label="LMS sidebar navigation" className="flex-1 overflow-y-auto px-2 py-3">
        {profile?.portal_type && PORTAL_TYPE_TO_PATH[profile.portal_type] && (
          <div className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Apprenticeship</p>
            )}
            <Link
              href={PORTAL_TYPE_TO_PATH[profile.portal_type]}
              onClick={() => setMobileOpen(false)}
              className={`group mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                pathname?.startsWith('/portal/')
                  ? 'bg-brand-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Scissors className={`h-4 w-4 flex-shrink-0 ${pathname?.startsWith('/portal/') ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              {!collapsed && <span className="flex-1 truncate">My Dashboard</span>}
            </Link>
          </div>
        )}

        {[
          { label: 'My Learning', items: learningItems },
          { label: 'Practice', items: practiceItems },
          { label: 'Community', items: communityItems },
          { label: 'Tools', items: toolItems },
        ].map(({ label, items }) => (
          <div key={label} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">{label}</p>
            )}
            {renderItems(items)}
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 space-y-0.5 border-t border-slate-800 px-2 py-3">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-slate-800 hover:text-red-400"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 lg:hidden">
        <Link href="/lms/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-blue-600">
            <GraduationCap aria-label="graduationcap" className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-black text-white">Elevate LMS</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`fixed bottom-0 left-0 top-14 z-40 w-72 transform bg-slate-900 transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      <div className={`fixed bottom-0 left-0 top-0 z-30 hidden flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 lg:flex ${collapsed ? 'w-16' : 'w-64'}`}>
        {sidebarContent}
      </div>
    </>
  );
}
