'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  FileText,
  Settings,
  MessageSquare,
  Award,
  Calendar,
  TrendingUp,
  ClipboardCheck,
  DollarSign,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Home,
  Briefcase,
  GraduationCap,
  Building2,
  Handshake,
  Shield,
  Bot,
  Activity,
  Megaphone,
  BarChart3,
} from 'lucide-react';
import { getAdminUrl } from '@/lib/config/admin-url';

// Role definitions
export type UserRole =
  | 'admin'
  | 'student'
  | 'apprentice'
  | 'instructor'
  | 'employer'
  | 'partner'
  | 'staff'
  | 'case_manager';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Navigation config by role
const NAV_CONFIG: Record<UserRole, { items: NavItem[]; title: string }> = {
  admin: {
    title: 'Admin',
    items: [
      { href: getAdminUrl('/dashboard'), label: 'Dashboard', icon: LayoutDashboard },
      { href: getAdminUrl('/operations'), label: 'Operations', icon: Activity },
      { href: getAdminUrl('/intelligence'), label: 'Intelligence', icon: Bot },
      { href: getAdminUrl('/students'), label: 'Students', icon: Users },
      { href: getAdminUrl('/programs'), label: 'Programs', icon: BookOpen },
      { href: getAdminUrl('/funding'), label: 'Funding', icon: DollarSign },
      { href: getAdminUrl('/program-holders'), label: 'Partners', icon: Handshake },
      { href: getAdminUrl('/crm'), label: 'Marketing', icon: Megaphone },
      { href: getAdminUrl('/compliance'), label: 'Compliance', icon: Shield },
      { href: getAdminUrl('/studio'), label: 'Dev Studio', icon: Settings },
    ],
  },
  student: {
    title: 'Student Portal',
    items: [
      { href: '/lms/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/lms/courses', label: 'Programs', icon: BookOpen },
      { href: '/lms/progress', label: 'Progress', icon: TrendingUp },
      { href: '/lms/assignments', label: 'Assignments', icon: ClipboardCheck },
      { href: '/lms/calendar', label: 'Schedule', icon: Calendar },
      { href: '/lms/messages', label: 'Messages', icon: MessageSquare },
      { href: '/lms/certificates', label: 'Certificates', icon: Award },
      { href: '/lms/settings', label: 'Settings', icon: Settings },
    ],
  },
  apprentice: {
    title: 'Apprentice Portal',
    items: [
      { href: '/apprentice', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/apprentice/hours', label: 'Clock Hours', icon: Clock },
      { href: '/apprentice/skills', label: 'Skills', icon: TrendingUp },
      { href: '/apprentice/attendance', label: 'Attendance', icon: Calendar },
      { href: '/apprentice/documents', label: 'Documents', icon: FileText },
      { href: '/lms/portfolio', label: 'Portfolio', icon: Briefcase },
      { href: '/apprentice/billing', label: 'Payments', icon: DollarSign },
      { href: '/lms/messages', label: 'Messages', icon: MessageSquare },
      { href: '/lms/library', label: 'Resources', icon: BookOpen },
      { href: '/apprentice/profile', label: 'Profile', icon: Settings },
    ],
  },
  instructor: {
    title: 'Instructor Portal',
    items: [
      { href: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/instructor/students', label: 'Students', icon: Users },
      { href: '/instructor/courses', label: 'Courses', icon: BookOpen },
      { href: '/instructor/grades', label: 'Grades', icon: FileText },
      { href: '/instructor/attendance', label: 'Attendance', icon: Calendar },
      { href: '/instructor/messages', label: 'Messages', icon: MessageSquare },
      { href: '/instructor/settings', label: 'Settings', icon: Settings },
    ],
  },
  employer: {
    title: 'Employer Portal',
    items: [
      { href: '/employer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/employer/employees', label: 'Employees', icon: Users },
      { href: '/employer/postings', label: 'Job Postings', icon: Briefcase },
      { href: '/employer/reports', label: 'Reports', icon: BarChart3 },
      { href: '/employer/messages', label: 'Messages', icon: MessageSquare },
      { href: '/employer/settings', label: 'Settings', icon: Settings },
    ],
  },
  partner: {
    title: 'Host Shop Portal',
    items: [
      { href: '/host-shop/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/host-shop/resources', label: 'Resources', icon: BookOpen },
      { href: '/host-shop/mou', label: 'MOU', icon: FileText },
      { href: '/host-shop/onboarding', label: 'Onboarding', icon: ClipboardCheck },
    ],
  },
  staff: {
    title: 'Staff Portal',
    items: [
      { href: '/staff-portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/staff-portal/cases', label: 'Cases', icon: FileText },
      { href: '/staff-portal/reports', label: 'Reports', icon: BarChart3 },
      { href: '/staff-portal/messages', label: 'Messages', icon: MessageSquare },
      { href: '/staff-portal/settings', label: 'Settings', icon: Settings },
    ],
  },
  case_manager: {
    title: 'Case Manager',
    items: [
      { href: '/case-manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/case-manager/clients', label: 'Clients', icon: Users },
      { href: '/case-manager/reports', label: 'Reports', icon: BarChart3 },
      { href: '/case-manager/messages', label: 'Messages', icon: MessageSquare },
      { href: '/case-manager/settings', label: 'Settings', icon: Settings },
    ],
  },
};

// Clock icon for apprentice
function Clock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

interface PlatformShellProps {
  role: UserRole;
  user: {
    id: string;
    email: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  notifications?: number;
}

export function PlatformShell({
  role,
  user,
  breadcrumbs = [],
  children,
  notifications = 0,
}: PlatformShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nav = NAV_CONFIG[role];
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  const userInitials =
    user.first_name && user.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`
      : user.full_name
        ? user.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
        : 'U';

  const userName =
    user.full_name ||
    (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'User');

  // Generate breadcrumbs from pathname
  const autoBreadcrumbs: BreadcrumbItem[] = pathname
    ? pathname
        .split('/')
        .filter(Boolean)
        .reduce((acc, segment, i, arr) => {
          const href = '/' + arr.slice(0, i + 1).join('/');
          const label = segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          acc.push({ label, href });
          return acc;
        }, [] as BreadcrumbItem[])
    : [];

  const finalBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : autoBreadcrumbs;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left: Logo + Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-slate-900 hidden sm:block">{nav.title}</span>
            </Link>
          </div>

          {/* Center: Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/lms/notifications"
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-brand-red-600 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications > 9 ? '9+' : notifications}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 bg-brand-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userInitials}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-medium text-slate-900">{userName}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <Link
                    href="/lms/settings/profile"
                    className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-700 w-full text-left">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        {finalBreadcrumbs.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="text-slate-500 hover:text-slate-700">
                <Home className="w-4 h-4" />
              </Link>
              {finalBreadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  <span className="text-slate-300">/</span>
                  {crumb.href && i < finalBreadcrumbs.length - 1 ? (
                    <Link
                      href={crumb.href}
                      className="text-slate-500 hover:text-slate-700 capitalize"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-900 font-medium capitalize">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        >
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {nav.title}
              </h2>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
              {nav.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors
                      ${
                        active
                          ? 'bg-brand-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-brand-red-600 text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-slate-700">
              <Link
                href="/lms/support"
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm"
              >
                <Bell className="w-4 h-4" />
                Support
              </Link>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="p-6">
            {mounted ? (
              children
            ) : (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-slate-200 rounded w-1/4" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="h-32 bg-slate-200 rounded" />
                  <div className="h-32 bg-slate-200 rounded" />
                  <div className="h-32 bg-slate-200 rounded" />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Export navigation config for use in other components
export { NAV_CONFIG };
