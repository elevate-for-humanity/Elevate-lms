"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NotificationBell } from './NotificationBell';
import {
  BookOpen,
  LayoutDashboard,
  Award,
  User,
  Menu,
  X,
  Search,
  LogOut,
  Calendar,
  MessageSquare,
  Settings,
  TrendingUp,
  ClipboardCheck,
  BookMarked,
  ChevronDown,
} from 'lucide-react';

interface LMSNavigationProps {
  user: {
    id: string;
    email: string;
  } | null;
  profile: {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    role?: string;
  } | null;
}

export function LMSNavigation({ user, profile }: LMSNavigationProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const supabase = createClient();

  // Load user stats from DB
  useEffect(() => {
    async function loadUserStats() {
      if (!user?.id) return;

      // Load unread message count
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('read', false);
      setUnreadMessages(msgCount || 0);

      // Load enrolled course count
      const { count: enrollCount } = await supabase
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');
      setCourseCount(enrollCount || 0);
    }
    loadUserStats();
  }, [user?.id, supabase]);

  const navItems = [
    { href: '/lms/dashboard', label: 'Dashboard', desc: 'Your home base', icon: LayoutDashboard },
    { href: '/lms/courses', label: 'My Courses', desc: 'Lessons & modules', icon: BookOpen, badge: courseCount > 0 ? courseCount : undefined },
    { href: '/lms/progress', label: 'Progress', desc: 'Track completion', icon: TrendingUp },
    { href: '/lms/quizzes', label: 'Quizzes', desc: 'Tests & exams', icon: ClipboardCheck },
    { href: '/lms/schedule', label: 'Schedule', desc: 'Dates & deadlines', icon: Calendar },
    { href: '/lms/messages', label: 'Messages', desc: 'Inbox & chat', icon: MessageSquare, badge: unreadMessages > 0 ? unreadMessages : undefined },
    { href: '/lms/certificates', label: 'Certificates', desc: 'Your credentials', icon: Award },
  ];

  // Resources available to learners inside the LMS — not surfaced on the marketing site.
  const resourceItems = [
    { href: '/orientation', label: 'Orientation' },
    { href: '/student-handbook', label: 'Student Handbook' },
    { href: '/academic-calendar', label: 'Academic Calendar' },
    { href: '/resources', label: 'Learning Resources' },
    { href: '/career-services', label: 'Career Services' },
    { href: '/employment-support', label: 'Employment Support' },
    { href: '/grievance', label: 'Grievance' },
    { href: '/support/help', label: 'Help Center' },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/');

  const userInitials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : profile?.full_name
      ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)
      : 'U';

  const userName = profile?.full_name || 
    (profile?.first_name && profile?.last_name 
      ? `${profile.first_name} ${profile.last_name}` 
      : 'Student');

  return (
    <nav role="navigation" aria-label="LMS navigation" className="bg-brand-blue-900 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/lms/dashboard" 
            aria-label="Learning Portal Home" 
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform p-1">
              <Image
                src="/logo.png"
                alt="Elevate for Humanity"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-lg text-white hidden sm:block">
              Learning Portal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.desc}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive(item.href)
                      ? 'bg-white text-brand-blue-900 shadow-sm'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-brand-red-500 text-white text-xs font-bold rounded-full px-1.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Resources dropdown — student-facing links that don't belong on the marketing site */}
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white/90 hover:bg-white/10 transition-all"
                aria-haspopup="true"
              >
                <BookMarked className="w-4 h-4" />
                <span className="hidden xl:inline">Resources</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50">
                <div className="bg-white rounded-lg shadow-lg border border-slate-200 py-2 min-w-[200px]">
                  {resourceItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-blue-600"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition text-white"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Settings - Desktop */}
            <Link
              href="/lms/settings"
              className="hidden md:flex p-2 hover:bg-white/10 rounded-lg transition text-white"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center gap-3 ml-2 pl-4 border-l border-white/20">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={userName}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {userInitials}
                </div>
              )}
              <div className="hidden lg:block">
                <div className="text-sm font-medium text-white">{userName}</div>
                <div className="text-xs text-white/60">{profile?.role || 'Student'}</div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition text-white"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="py-4 border-t border-white/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses, lessons, certificates..."
                className="w-full pl-10 pr-4 py-3 bg-white border-0 rounded-lg focus:ring-2 focus:ring-brand-red-500"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                      isActive(item.href)
                        ? 'bg-white text-brand-blue-900'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {item.label}
                        {item.badge && (
                          <span className="min-w-[20px] h-5 flex items-center justify-center bg-brand-red-500 text-white text-xs font-bold rounded-full px-1.5">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <div className={`text-xs ${isActive(item.href) ? 'text-brand-blue-600' : 'text-white/50'}`}>
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            
            {/* Resources section */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="px-4 py-2 text-xs font-bold text-white/40 uppercase tracking-wide">Resources</div>
              {resourceItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-white/80 hover:bg-white/10 rounded-lg text-sm"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile User Section */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3 px-4 py-2">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={userName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-brand-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    {userInitials}
                  </div>
                )}
                <div>
                  <div className="font-medium text-white">{userName}</div>
                  <div className="text-sm text-white/60">{user?.email}</div>
                </div>
              </div>
              
              <div className="mt-2 space-y-1">
                <Link
                  href="/lms/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-white hover:bg-white/10 rounded-lg"
                >
                  <User className="w-5 h-5" />
                  Profile
                </Link>
                <Link
                  href="/lms/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-white hover:bg-white/10 rounded-lg"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="flex items-center gap-3 px-4 py-2 text-brand-red-300 hover:bg-brand-red-500/20 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
