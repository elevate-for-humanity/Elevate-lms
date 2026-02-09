"use client";

import { createClient } from '@/lib/supabase/client';

import React, { useEffect } from 'react';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Award,
  Calendar,
  MessageCircle,
  FolderOpen,
  Bell,
  User,
  Settings,
  Users,
  Briefcase,
  Clock,
  CreditCard,
  Folder,
  Star,
  Target,
  Eye,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const mainNavigation = [
  { name: 'Dashboard', href: '/portal/student/dashboard', icon: LayoutDashboard },
  { name: 'Courses', href: '/portal/student/courses', icon: BookOpen },
  { name: 'Assignments', href: '/portal/student/assignments', icon: FileText },
  { name: 'Grades', href: '/portal/student/grades', icon: Award },
  { name: 'Messages', href: '/portal/student/messages', icon: MessageCircle },
];

const moreNavigation = [
  { name: 'Schedule', href: '/portal/student/calendar', icon: Calendar },
  { name: 'Resources', href: '/portal/student/resources', icon: FolderOpen },
  { name: 'Certificates', href: '/portal/student/certificates', icon: Award },
  { name: 'Study Groups', href: '/portal/student/study-groups', icon: Users },
  { name: 'Career Counseling', href: '/portal/student/career-counseling', icon: Briefcase },
  { name: 'Apprenticeship Hours', href: '/portal/student/apprenticeship-hours', icon: Clock },
  { name: 'Payments', href: '/portal/student/payments', icon: CreditCard },
  { name: 'Portfolio', href: '/portal/student/portfolio', icon: Folder },
  { name: 'Peer Review', href: '/portal/student/peer-review', icon: Star },
  { name: 'Competencies', href: '/portal/student/competencies', icon: Target },
  { name: 'Accessibility', href: '/portal/student/accessibility', icon: Eye },
];

export default function StudentPortalNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const supabase = createClient();

  // Load user profile and notification count from DB
  useEffect(() => {
    async function loadNavData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', user.id)
        .single();
      
      if (profile) setUserProfile(profile);

      // Load unread notification count
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);
      
      setUnreadCount(count || 0);
    }
    loadNavData();
  }, [supabase]);

  return (
    <nav role="navigation" aria-label="Main navigation" className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-6">
            <Link href="/portal/student/dashboard" aria-label="Link" className="text-xl font-bold text-blue-600 whitespace-nowrap">
              Student Portal
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-black hover:bg-gray-50 hover:text-black'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* More Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-black hover:bg-gray-50 hover:text-black"
                >
                  <span>More</span>
                  <ChevronDown size={16} />
                </button>

                {moreMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMoreMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      {moreNavigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMoreMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${
                              isActive ? 'text-blue-600 bg-blue-50' : 'text-black'
                            }`}
                          >
                            <Icon size={16} />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2">
            <Link
              href="/portal/student/notifications"
              className="p-2 text-black hover:bg-gray-50 rounded-lg"
            >
              <Bell size={20} />
            </Link>
            <Link
              href="/portal/student/profile"
              className="p-2 text-black hover:bg-gray-50 rounded-lg"
            >
              <User size={20} />
            </Link>
            <Link
              href="/portal/student/settings"
              className="hidden md:block p-2 text-black hover:bg-gray-50 rounded-lg"
            >
              <Settings size={20} />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-black hover:bg-gray-50 rounded-lg"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-1">
              {[...mainNavigation, ...moreNavigation].map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-black hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <Link
                href="/portal/student/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-black hover:bg-gray-50"
              >
                <Settings size={18} />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
