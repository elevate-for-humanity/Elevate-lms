/**
 * DASHBOARD NAVIGATION CONFIGURATION
 *
 * Single source of truth for all dashboard navigation across roles.
 * Each role has its own navigation structure optimized for their workflow.
 */

import {
  LayoutDashboard,
  BookOpen,
  Award,
  User,
  Users,
  FileText,
  Shield,
  Briefcase,
  Building2,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  Settings,
  Mail,
  Share2,
  Sparkles,
  Bell,
  MessageCircle,
  DollarSign,
  BarChart3,
  CheckSquare,
  AlertTriangle,
  Calendar,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: NavItem[];
}

export interface NavSection {
  name: string;
  icon: LucideIcon;
  children: NavItem[];
}

/**
 * Student Navigation
 * Focus: Learning, progress, credentials
 */
export const studentNavigation: NavItem[] = [
  {
    href: '/learner/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/lms/courses',
    label: 'My Courses',
    icon: BookOpen,
  },
];

/**
 * Admin Navigation
 * Focus: System oversight, compliance, operations
 */
export const adminNavigation: (NavItem | NavSection)[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Marketing',
    icon: Sparkles,
    children: [
      { href: '/admin/email-marketing', label: 'Email Marketing', icon: Mail },
      { href: '/admin/social-media', label: 'Social Media', icon: Share2 },
      {
        href: '/admin/email-marketing/automation',
        label: 'Automation',
        icon: Settings,
      },
    ],
  },
  {
    name: 'Communications',
    icon: MessageCircle,
    children: [
      { href: '/admin/notifications', label: 'Push Notifications', icon: Bell },
      { href: '/admin/live-chat', label: 'Live Chat', icon: MessageCircle },
    ],
  },
  {
    name: 'HR & Payroll',
    icon: DollarSign,
    children: [
      { href: '/admin/hr/employees', label: 'Employees', icon: Users },
      { href: '/admin/hr/payroll', label: 'Payroll', icon: DollarSign },
    ],
  },
  {
    name: 'Programs',
    icon: BookOpen,
    children: [
      { href: '/admin/programs', label: 'All Programs', icon: BookOpen },
      { href: '/admin/courses', label: 'Courses', icon: GraduationCap },
    ],
  },
  {
    name: 'Students',
    icon: GraduationCap,
    children: [
      { href: '/admin/students', label: 'All Students', icon: Users },
      { href: '/onboarding', label: 'Onboarding', icon: ClipboardCheck },
      {
        href: '/admin/analytics/learning',
        label: 'Progress Tracking',
        icon: TrendingUp,
      },
    ],
  },
  {
    name: 'Staff Management',
    icon: Users,
    children: [
      { href: '/admin/hr/employees', label: 'Staff Directory', icon: Users },
      {
        href: '/onboarding/staff',
        label: 'Staff Onboarding',
        icon: ClipboardCheck,
      },
      {
        href: '/admin/instructors/performance',
        label: 'Performance',
        icon: BarChart3,
      },
    ],
  },
  {
    name: 'Program Holders',
    icon: Building2,
    children: [
      {
        href: '/admin/program-holders',
        label: 'All Partners',
        icon: Building2,
      },
      { href: '/admin/docs/mou', label: 'MOUs', icon: FileText },
      {
        href: '/partners/portal',
        label: 'Partner Portal',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    name: 'Documents',
    icon: FileText,
    children: [
      { href: '/admin/docs/mou', label: 'MOUs', icon: FileText },
      { href: '/onboarding/handbook', label: 'Handbooks', icon: BookOpen },
      { href: '/privacy-policy', label: 'Privacy Policy', icon: Shield },
      {
        href: '/onboarding/handbook',
        label: 'Employee Handbook',
        icon: BookOpen,
      },
    ],
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    children: [
      { href: '/admin/analytics', label: 'Overview', icon: BarChart3 },
      {
        href: '/admin/analytics/engagement',
        label: 'Student Engagement',
        icon: TrendingUp,
      },
      { href: '/admin/retention', label: 'Retention', icon: Users },
      { href: '/admin/outcomes', label: 'Outcomes', icon: Award },
    ],
  },
  {
    name: 'Compliance',
    icon: Shield,
    children: [
      {
        href: '/admin/compliance-dashboard',
        label: 'WIOA Dashboard',
        icon: Shield,
      },
      { href: '/admin/reports', label: 'Reports', icon: FileText },
    ],
  },
];

/**
 * Program Holder Navigation
 * Focus: Student management, compliance, reporting
 */
export const programHolderNavigation: NavItem[] = [
  {
    href: '/program-holder/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/program-holder/students',
    label: 'Students',
    icon: Users,
  },
  {
    href: '/program-holder/reports',
    label: 'Reports',
    icon: FileText,
  },
  {
    href: '/program-holder/compliance',
    label: 'Compliance',
    icon: Shield,
  },
  {
    href: '/program-holder/documents',
    label: 'Documents',
    icon: FileText,
  },
  {
    href: '/program-holder/settings',
    label: 'Settings',
    icon: Settings,
  },
];

/**
 * Employer Navigation
 * Focus: Hiring, candidates, apprenticeships
 */
export const employerNavigation: NavItem[] = [
  {
    href: '/employer/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/employer/jobs',
    label: 'Job Postings',
    icon: Briefcase,
  },
  {
    href: '/employer/candidates',
    label: 'Candidates',
    icon: Users,
  },
];

/**
 * Staff Navigation
 * Focus: Student support, tasks, reporting
 */
export const staffNavigation: NavItem[] = [
  {
    href: '/staff-portal/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/staff-portal/students',
    label: 'Students',
    icon: Users,
  },
];

/**
 * Instructor Navigation
 * Focus: Course management, students, grading
 */
export const instructorNavigation: NavItem[] = [
  {
    href: '/instructor/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/instructor/students',
    label: 'Students',
    icon: Users,
  },
];

/**
 * Board Member Navigation
 * Board members don't have a dedicated dashboard yet.
 * They should use admin dashboard if they have admin access.
 */
export const boardNavigation: NavItem[] = [];

/**
 * Workforce Board Navigation
 * Workforce board members don't have a dedicated dashboard yet.
 */
export const workforceBoardNavigation: NavItem[] = [];

/**
 * Parent Navigation
 * Focus: Student progress, communication
 */
/**
 * Get navigation for a specific role
 */
export function getDashboardNavigation(
  role: string
): NavItem[] | (NavItem | NavSection)[] {
  switch (role) {
    case 'student':
      return studentNavigation;
    case 'admin':
    case 'super_admin':
    case 'org_admin':
      return adminNavigation;
    case 'program_holder':
    case 'partner':
      return programHolderNavigation;
    case 'employer':
      return employerNavigation;
    case 'staff':
      return staffNavigation;
    case 'instructor':
      return instructorNavigation;
    case 'board_member':
      return boardNavigation;
    case 'workforce_board':
      return workforceBoardNavigation;
    default:
      return studentNavigation;
  }
}

/**
 * Get dashboard route for a specific role
 */
export function getDashboardRoute(role: string): string {
  switch (role) {
    case 'admin':
    case 'super_admin':
    case 'org_admin':
      return '/admin/dashboard';
    case 'program_holder':
    case 'partner':
      return '/program-holder/dashboard';
    case 'employer':
      return '/employer/dashboard';
    case 'staff':
      return '/staff-portal/dashboard';
    case 'instructor':
      return '/instructor/dashboard';
    case 'board_member':
    case 'workforce_board':
      // These roles don't have dedicated dashboards
      return '/dashboard';
    case 'student':
    default:
      return '/learner/dashboard';
  }
}

/**
 * Check if a user has access to a specific route based on their role
 */
export function hasRouteAccess(role: string, route: string): boolean {
  const navigation = getDashboardNavigation(role);

  // Flatten navigation to check all routes
  const flattenNav = (items: (NavItem | NavSection)[]): string[] => {
    const routes: string[] = [];

    for (const item of items) {
      if ('href' in item) {
        routes.push(item.href);
      }
      if ('children' in item && item.children) {
        routes.push(...flattenNav(item.children));
      }
    }

    return routes;
  };

  const allowedRoutes = flattenNav(navigation);
  return allowedRoutes.some((allowed) => route.startsWith(allowed));
}

/**
 * Role display names
 */
export const roleDisplayNames: Record<string, string> = {
  student: 'Student',
  instructor: 'Instructor',
  staff: 'Staff',
  admin: 'Admin',
  super_admin: 'Super Admin',
  org_admin: 'Organization Admin',
  program_holder: 'Program Holder',
  partner: 'Partner',
  employer: 'Employer',
  board_member: 'Board Member',
  workforce_board: 'Workforce Board',
};

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: string): string {
  return roleDisplayNames[role] || 'User';
}
