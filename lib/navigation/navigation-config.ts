// lib/navigation/navigation-config.ts
// Unified navigation configuration for all platform roles

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
  Clock,
  Target,
  FolderKanban,
  UserCheck,
  ClipboardList,
  Wallet,
  Star,
  BookMarked,
  FileCheck,
  Truck,
  UsersRound,
  Building,
  PieChart,
  Inbox,
  Send,
  CreditCard,
  LogOut,
  ChevronRight,
  Eye,
  Plus,
  Download,
  Upload,
  Edit,
  Trash2,
  Filter,
  RefreshCw,
} from 'lucide-react';

// Role type
export type UserRole =
  | 'admin'
  | 'admin'
  | 'student'
  | 'apprentice'
  | 'instructor'
  | 'employer'
  | 'partner'
  | 'staff'
  | 'case_manager'
  | 'sponsor'
  | 'host_shop'
  | 'workforce';

// Navigation item interface
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  children?: NavItem[];
  dividerBefore?: boolean;
}

// Action item for page headers
export interface ActionItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'ghost';
}

// Breadcrumb item
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Navigation section
export interface NavSection {
  id: string;
  label?: string;
  items: NavItem[];
}

// Navigation config per role
export const ROLE_NAVIGATION: Record<UserRole, NavSection[]> = {
  admin: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { id: 'operations', label: 'Operations', href: '/admin/operations', icon: Activity },
        { id: 'intelligence', label: 'Intelligence', href: '/admin/intelligence', icon: Bot },
      ],
    },
    {
      id: 'students',
      label: 'Learners',
      items: [
        { id: 'students', label: 'Students', href: '/admin/students', icon: Users },
        { id: 'programs', label: 'Programs', href: '/admin/programs', icon: BookOpen },
        { id: 'credentials', label: 'Credentials', href: '/admin/credentials', icon: Award },
        { id: 'enrollments', label: 'Enrollments', href: '/admin/enrollments', icon: FileCheck },
      ],
    },
    {
      id: 'business',
      label: 'Business',
      items: [
        { id: 'funding', label: 'Funding', href: '/admin/funding', icon: DollarSign },
        { id: 'program-holders', label: 'Partners', href: '/admin/program-holders', icon: Handshake },
        { id: 'crm', label: 'Marketing', href: '/admin/crm', icon: Megaphone },
      ],
    },
    {
      id: 'compliance',
      label: 'Compliance',
      items: [
        { id: 'compliance', label: 'Compliance', href: '/admin/compliance', icon: Shield },
        { id: 'audit-logs', label: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
        { id: 'ferpa', label: 'FERPA', href: '/admin/ferpa', icon: UserCheck },
      ],
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        { id: 'studio', label: 'Dev Studio', href: '/admin/dev-studio', icon: Settings },
        { id: 'reports', label: 'Reports', href: '/admin/reports', icon: BarChart3 },
      ],
    },
  ],

  student: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/lms/dashboard', icon: LayoutDashboard },
        { id: 'courses', label: 'My Programs', href: '/lms/courses', icon: BookOpen },
        { id: 'progress', label: 'Progress', href: '/lms/progress', icon: TrendingUp },
        { id: 'assignments', label: 'Assignments', href: '/lms/assignments', icon: ClipboardCheck },
        { id: 'calendar', label: 'Schedule', href: '/lms/calendar', icon: Calendar },
        { id: 'attendance', label: 'Attendance', href: '/lms/attendance', icon: BookMarked },
      ],
    },
    {
      id: 'resources',
      items: [
        { id: 'messages', label: 'Messages', href: '/lms/messages', icon: MessageSquare },
        { id: 'certificates', label: 'Certificates', href: '/lms/certificates', icon: Award },
        { id: 'library', label: 'Library', href: '/lms/library', icon: FolderKanban },
      ],
    },
    {
      id: 'account',
      items: [
        { id: 'settings', label: 'Settings', href: '/lms/settings', icon: Settings },
      ],
    },
  ],

  apprentice: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/apprentice', icon: LayoutDashboard },
        { id: 'hours', label: 'Clock Hours', href: '/apprentice/hours', icon: Clock },
        { id: 'timeclock', label: 'Timeclock', href: '/apprentice/timeclock', icon: Clock },
        { id: 'skills', label: 'Skills', href: '/apprentice/skills', icon: Target },
        { id: 'competencies', label: 'Competencies', href: '/apprentice/competencies', icon: Award },
      ],
    },
    {
      id: 'training',
      label: 'Training',
      items: [
        { id: 'course', label: 'RTI Course', href: '/lms/courses', icon: BookOpen },
        { id: 'documents', label: 'Documents', href: '/apprentice/documents', icon: FileText },
        { id: 'workbook', label: 'Workbook', href: '/apprentice/workbook', icon: ClipboardList },
      ],
    },
    {
      id: 'account',
      items: [
        { id: 'billing', label: 'Billing', href: '/apprentice/billing', icon: DollarSign },
        { id: 'handbook', label: 'Handbook', href: '/apprentice/handbook', icon: BookMarked },
        { id: 'profile', label: 'Profile', href: '/apprentice/profile', icon: Settings },
      ],
    },
  ],

  instructor: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/instructor/dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Students', href: '/instructor/students', icon: Users },
        { id: 'courses', label: 'Courses', href: '/instructor/courses', icon: BookOpen },
        { id: 'attendance', label: 'Attendance', href: '/instructor/attendance', icon: Calendar },
        { id: 'grades', label: 'Grades', href: '/instructor/grades', icon: ClipboardCheck },
      ],
    },
    {
      id: 'communication',
      items: [
        { id: 'messages', label: 'Messages', href: '/instructor/messages', icon: MessageSquare },
        { id: 'announcements', label: 'Announcements', href: '/instructor/announcements', icon: Send },
      ],
    },
    {
      id: 'account',
      items: [
        { id: 'settings', label: 'Settings', href: '/instructor/settings', icon: Settings },
      ],
    },
  ],

  employer: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/employer/dashboard', icon: LayoutDashboard },
        { id: 'apprentices', label: 'Apprentices', href: '/employer/apprentices', icon: GraduationCap },
        { id: 'employees', label: 'Employees', href: '/employer/employees', icon: Users },
        { id: 'evaluations', label: 'Evaluations', href: '/employer/evaluations', icon: ClipboardCheck },
      ],
    },
    {
      id: 'tracking',
      label: 'Tracking',
      items: [
        { id: 'timesheets', label: 'Timesheets', href: '/employer/timesheets', icon: Clock },
        { id: 'workforce', label: 'Workforce', href: '/employer/workforce', icon: Briefcase },
        { id: 'reports', label: 'Reports', href: '/employer/reports', icon: BarChart3 },
      ],
    },
    {
      id: 'account',
      items: [
        { id: 'settings', label: 'Settings', href: '/employer/settings', icon: Settings },
      ],
    },
  ],

  partner: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/partner/dashboard', icon: LayoutDashboard },
        { id: 'programs', label: 'Programs', href: '/partner/programs', icon: BookOpen },
        { id: 'students', label: 'Students', href: '/partner/students', icon: Users },
        { id: 'reports', label: 'Reports', href: '/partner/reports', icon: BarChart3 },
      ],
    },
    {
      id: 'account',
      items: [
        { id: 'settings', label: 'Settings', href: '/partner/settings', icon: Settings },
      ],
    },
  ],

  staff: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/staff-portal/dashboard', icon: LayoutDashboard },
        { id: 'cases', label: 'Cases', href: '/staff-portal/cases', icon: FolderKanban },
        { id: 'clients', label: 'Clients', href: '/staff-portal/clients', icon: Users },
        { id: 'reports', label: 'Reports', href: '/staff-portal/reports', icon: BarChart3 },
      ],
    },
    {
      id: 'account',
      items: [
        { id: 'settings', label: 'Settings', href: '/staff-portal/settings', icon: Settings },
      ],
    },
  ],

  case_manager: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/case-manager/dashboard', icon: LayoutDashboard },
        { id: 'clients', label: 'Clients', href: '/case-manager/clients', icon: Users },
        { id: 'referrals', label: 'Referrals', href: '/case-manager/referrals', icon: Send },
        { id: 'reports', label: 'Reports', href: '/case-manager/reports', icon: BarChart3 },
      ],
    },
    {
      id: 'account',
      items: [
        { id: 'settings', label: 'Settings', href: '/case-manager/settings', icon: Settings },
      ],
    },
  ],

  sponsor: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/sponsor/dashboard', icon: LayoutDashboard },
        { id: 'programs', label: 'Programs', href: '/sponsor/programs', icon: BookOpen },
        { id: 'reports', label: 'Reports', href: '/sponsor/reports', icon: BarChart3 },
      ],
    },
    {
      id: 'account',
      items: [
        { id: 'settings', label: 'Settings', href: '/sponsor/settings', icon: Settings },
      ],
    },
  ],

  host_shop: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/host-shop/dashboard', icon: LayoutDashboard },
        { id: 'apprentices', label: 'Apprentices', href: '/host-shop/apprentices', icon: GraduationCap },
        { id: 'evaluations', label: 'Evaluations', href: '/host-shop/evaluations', icon: ClipboardCheck },
        { id: 'timesheets', label: 'Timesheets', href: '/host-shop/timesheets', icon: Clock },
      ],
    },
    {
      id: 'account',
      items: [
        { id: 'settings', label: 'Settings', href: '/host-shop/settings', icon: Settings },
      ],
    },
  ],

  workforce: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/workforce/dashboard', icon: LayoutDashboard },
        { id: 'programs', label: 'Programs', href: '/workforce/programs', icon: BookOpen },
        { id: 'clients', label: 'Clients', href: '/workforce/clients', icon: Users },
        { id: 'reports', label: 'Reports', href: '/workforce/reports', icon: BarChart3 },
      ],
    },
    {
      id: 'account',
      items: [
        { id: 'settings', label: 'Settings', href: '/workforce/settings', icon: Settings },
      ],
    },
  ],

  admin: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { id: 'tenants', label: 'Tenants', href: '/admin/tenants', icon: Building2 },
        { id: 'users', label: 'Users', href: '/admin/users', icon: Users },
        { id: 'settings', label: 'Settings', href: '/admin/settings', icon: Settings },
      ],
    },
  ],
};

// Get navigation for a role
export function getNavigationForRole(role: UserRole): NavSection[] {
  return ROLE_NAVIGATION[role] || ROLE_NAVIGATION.student;
}

// Get all nav items flattened for a role
export function getFlatNavItems(role: UserRole): NavItem[] {
  const sections = getNavigationForRole(role);
  return sections.flatMap((section) => section.items);
}

// Check if a path matches a nav item
export function isActiveNavItem(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

// Default breadcrumbs generator
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (!pathname) return [];

  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = '';
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += '/' + segment;

    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    breadcrumbs.push({
      label,
      href: i < segments.length - 1 ? currentPath : undefined,
    });
  }

  return breadcrumbs;
}

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Admin',
  admin: 'Super Admin',
  student: 'Student',
  apprentice: 'Apprentice',
  instructor: 'Instructor',
  employer: 'Employer',
  partner: 'Partner',
  staff: 'Staff',
  case_manager: 'Case Manager',
  sponsor: 'Sponsor',
  host_shop: 'Host Shop',
  workforce: 'Workforce',
};

// Default actions per role
export const ROLE_DEFAULT_ACTIONS: Record<UserRole, ActionItem[]> = {
  admin: [
    { id: 'add-student', label: 'Add Student', href: '/admin/students/new', icon: Plus, variant: 'primary' },
    { id: 'view-all', label: 'View All', href: '/admin/students', variant: 'secondary' },
  ],
  student: [
    { id: 'view-courses', label: 'My Courses', href: '/lms/courses', variant: 'secondary' },
  ],
  apprentice: [
    { id: 'clock-in', label: 'Clock In', href: '/apprentice/timeclock', icon: Clock, variant: 'primary' },
  ],
  instructor: [
    { id: 'add-grade', label: 'Add Grade', href: '/instructor/grades/new', icon: Plus, variant: 'primary' },
  ],
  employer: [
    { id: 'add-employee', label: 'Add Employee', href: '/employer/employees/new', icon: Plus, variant: 'primary' },
  ],
  partner: [],
  staff: [],
  case_manager: [],
  sponsor: [],
  host_shop: [],
  workforce: [],
  admin: [],
};
