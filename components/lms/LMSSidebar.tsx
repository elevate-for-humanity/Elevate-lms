'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  Folder,
  GraduationCap,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Play,
  Scissors,
  Settings,
  Target,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { createClient } from '@/lib/supabase/client';

const PORTAL_TYPE_TO_PATH: Record<string, string> = {
  barber: '/apprentice?program=barber-apprenticeship',
  cosmetology: '/apprentice?program=cosmetology-apprenticeship',
  esthetician: '/apprentice?program=esthetician-apprenticeship',
  'nail-technician': '/apprentice?program=nail-technician-apprenticeship',
  culinary: '/apprentice?program=culinary-apprenticeship',
  electrical: '/apprentice?program=electrical',
  plumbing: '/apprentice?program=plumbing',
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

type NavItem = { href: string; label: string; icon: typeof Home };

const primaryItems: NavItem[] = [
  { href: '/lms/dashboard', label: 'Home', icon: Home },
  { href: '/lms/community', label: 'Community', icon: Users },
  { href: '/lms/groups', label: 'Groups', icon: Users },
  { href: '/lms/courses', label: 'Learn', icon: BookOpen },
  { href: '/lms/events', label: 'Events', icon: CalendarDays },
  { href: '/lms/progress', label: 'Progress', icon: TrendingUp },
  { href: '/lms/ai-team', label: 'AI Team', icon: Bot },
];

const courseworkItems: NavItem[] = [
  { href: '/lms/achievements', label: 'Achievements', icon: Trophy },
  { href: '/lms/certificates', label: 'Certificates', icon: Award },
  { href: '/lms/grades', label: 'Grades', icon: ClipboardCheck },
  { href: '/lms/learning-paths', label: 'Learning Paths', icon: Play },
  { href: '/lms/assignments', label: 'Assignments', icon: Target },
  { href: '/lms/quizzes', label: 'Quizzes', icon: Zap },
  { href: '/lms/peer-review', label: 'Peer Review', icon: Users },
];

const communicationItems: NavItem[] = [
  { href: '/lms/members', label: 'Members', icon: Users },
  { href: '/lms/messages', label: 'Messages', icon: MessageSquare },
  { href: '/lms/jobs', label: 'Career Opportunities', icon: BriefcaseBusiness },
];

const toolItems: NavItem[] = [
  { href: '/lms/calendar', label: 'Full Calendar', icon: CalendarDays },
  { href: '/lms/files', label: 'Files', icon: Folder },
  { href: '/lms/library', label: 'Library', icon: BookOpen },
  { href: '/lms/notifications', label: 'Notifications', icon: Bell },
  { href: '/lms/payments', label: 'Payments', icon: FileText },
];

const bottomItems: NavItem[] = [
  { href: '/lms/support', label: 'Get Help', icon: HelpCircle },
  { href: '/lms/settings', label: 'Settings', icon: Settings },
];

/* eslint-disable react-hooks/static-components -- pre-existing pattern: NavLink/Section use closures over collapsed/state */

export function LMSSidebar({ user, profile, courseCount = 0, unreadMessages = 0 }: LMSSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);
  const userInitials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : profile?.full_name
      ? profile.full_name.split(' ').map((part) => part[0]).join('').slice(0, 2)
      : (user.email?.[0] ?? 'U').toUpperCase();
  const userName = profile?.full_name || (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : user.email?.split('@')[0] ?? 'Student');

  const badgeFor = (href: string) => {
    if (href === '/lms/courses' && courseCount > 0) return courseCount;
    if (href === '/lms/messages' && unreadMessages > 0) return unreadMessages;
    return undefined;
  };

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const badge = badgeFor(item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? 'bg-brand-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <><span className="flex-1 truncate">{item.label}</span>{badge !== undefined && <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-black">{badge}</span>}</>}
      </Link>
    );
  };

  const Section = ({ label, items }: { label: string; items: NavItem[] }) => (
    <div className="mb-4">
      {!collapsed && <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">{label}</p>}
      {items.map((item) => <NavLink key={item.href} item={item} />)}
    </div>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-800 px-4">
        <Link href="/lms/dashboard" className="flex min-w-0 items-center gap-2.5"><div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-blue-600"><GraduationCap className="h-5 w-5 text-white" /></div>{!collapsed && <span className="truncate text-sm font-black tracking-tight text-white">Elevate</span>}</Link>
        <button onClick={() => setCollapsed(!collapsed)} className="hidden h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-white lg:flex" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} /></button>
      </div>

      <div className={`flex-shrink-0 border-b border-slate-800 px-4 py-4 ${collapsed ? 'px-2' : ''}`}><div className="flex items-center gap-3">{profile?.avatar_url ? <img src={profile.avatar_url} alt={userName} className="h-9 w-9 flex-shrink-0 rounded-full object-cover ring-2 ring-slate-700" /> : <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-blue-600 text-sm font-black text-white">{userInitials}</div>}{!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{userName}</p><p className="truncate text-xs capitalize text-slate-400">{profile?.role ?? 'Student'}</p></div>}{!collapsed && <NotificationBell />}</div></div>

      <nav aria-label="LMS navigation" className="flex-1 overflow-y-auto px-2 py-3">
        {profile?.portal_type && PORTAL_TYPE_TO_PATH[profile.portal_type] && <div className="mb-4">{!collapsed && <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Apprenticeship</p>}<Link href={PORTAL_TYPE_TO_PATH[profile.portal_type]} onClick={() => setMobileOpen(false)} className={`mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${pathname?.startsWith('/apprentice') ? 'bg-brand-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Scissors className="h-4 w-4" />{!collapsed && <span>My Apprenticeship</span>}</Link></div>}
        <Section label="Start here" items={primaryItems} />
        <Section label="Coursework" items={courseworkItems} />
        <Section label="Communication" items={communicationItems} />
        <Section label="Tools" items={toolItems} />
      </nav>

      <div className="flex-shrink-0 space-y-0.5 border-t border-slate-800 px-2 py-3">{bottomItems.map((item) => <NavLink key={item.href} item={item} />)}<button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-800 hover:text-red-400"><LogOut className="h-4 w-4" />{!collapsed && <span>Sign Out</span>}</button></div>
    </div>
  );

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 lg:hidden"><Link href="/lms/dashboard" className="flex items-center gap-2"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-blue-600"><GraduationCap className="h-4 w-4 text-white" /></div><span className="text-sm font-black text-white">Elevate</span></Link><div className="flex items-center gap-2"><NotificationBell /><button onClick={() => setMobileOpen(!mobileOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Toggle menu">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div></div>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className={`fixed bottom-0 left-0 top-14 z-40 w-72 transform bg-slate-900 transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>{sidebarContent}</div>
      <div className={`fixed bottom-0 left-0 top-0 z-30 hidden flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 lg:flex ${collapsed ? 'w-16' : 'w-64'}`}>{sidebarContent}</div>
    </>
  );
}
