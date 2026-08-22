// lib/navigation/navigation-config.ts
// Canonical portal-level navigation. Database role aliases map into these
// portal menus; they do not maintain separate route trees.

import type React from 'react';
import {
  Activity, Award, BarChart3, BookOpen, Briefcase, Building2, Calendar,
  ClipboardCheck, ClipboardList, Clock, FileText, GraduationCap,
  LayoutDashboard, Palette, Plus, Settings, Shield, Target, Users,
} from 'lucide-react';
import { PortalRouter } from '@/lib/routing/portal-router';

export type UserRole =
  | 'student' | 'learner' | 'user' | 'delegate' | 'grant_client'
  | 'apprentice' | 'barber_apprentice' | 'cosmetology_apprentice'
  | 'instructor' | 'employer' | 'sponsor' | 'recruiter'
  | 'partner' | 'partner_admin' | 'host_shop' | 'host_shop_admin' | 'mentor'
  | 'staff' | 'case_manager' | 'workforce' | 'workforce_partner'
  | 'workforce_board' | 'workforce_board_admin' | 'government'
  | 'program_holder' | 'provider' | 'provider_admin' | 'creator' | 'parent'
  | 'admin' | 'org_admin' | 'super_admin' | 'advisor'
  | 'test_admin' | 'proctor' | 'testing_center'
  | 'financial_aid' | 'compliance' | 'dev_studio';

export type NavigationRole =
  | 'student' | 'apprentice' | 'instructor' | 'employer' | 'host_shop'
  | 'staff' | 'case_manager' | 'workforce' | 'workforce_board'
  | 'program_holder' | 'provider' | 'creator' | 'parent' | 'admin' | 'testing';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  children?: NavItem[];
  dividerBefore?: boolean;
}
export interface ActionItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'primary' | 'secondary' | 'ghost';
}
export interface BreadcrumbItem { label: string; href?: string }
export interface NavSection { id: string; label?: string; items: NavItem[] }

const p = (key: Parameters<typeof PortalRouter.get>[0], path?: string) =>
  path ? PortalRouter.getPath(key, path) : PortalRouter.get(key);

export const ROLE_NAVIGATION: Record<NavigationRole, NavSection[]> = {
  student: [{ id: 'learning', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('lms'), icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', href: p('lms', 'courses'), icon: BookOpen },
    { id: 'progress', label: 'Progress', href: p('lms', 'progress'), icon: BarChart3 },
    { id: 'assignments', label: 'Assignments', href: p('lms', 'assignments'), icon: ClipboardCheck },
    { id: 'calendar', label: 'Schedule', href: p('lms', 'calendar'), icon: Calendar },
    { id: 'certificates', label: 'Certificates', href: p('lms', 'certificates'), icon: Award },
  ] }],
  apprentice: [{ id: 'apprenticeship', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('apprentice'), icon: LayoutDashboard },
    { id: 'hours', label: 'Work Hours', href: p('apprentice', 'hours'), icon: Clock },
    { id: 'timeclock', label: 'Timeclock', href: p('apprentice', 'timeclock'), icon: Clock },
    { id: 'competencies', label: 'Competencies', href: p('apprentice', 'competencies'), icon: Target },
    { id: 'documents', label: 'Documents', href: p('apprentice', 'documents'), icon: FileText },
    { id: 'rti', label: 'RTI Courses', href: p('lms', 'courses'), icon: BookOpen },
  ] }],
  employer: [{ id: 'operations', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('employer'), icon: LayoutDashboard },
    { id: 'jobs', label: 'Job Postings', href: p('employer', 'jobs'), icon: Briefcase },
    { id: 'applications', label: 'Applications', href: p('employer', 'applications'), icon: Users },
    { id: 'apprenticeships', label: 'Apprenticeships', href: p('employer', 'apprenticeships'), icon: GraduationCap },
    { id: 'company', label: 'Company Profile', href: p('employer', 'company'), icon: Building2 },
    { id: 'reports', label: 'Reports', href: p('employer', 'reports'), icon: BarChart3 },
  ] }],
  host_shop: [{ id: 'host-shop', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('hostshop'), icon: LayoutDashboard },
    { id: 'apprentices', label: 'Apprentices', href: p('hostshop', 'apprentices'), icon: GraduationCap },
    { id: 'hours', label: 'Work Hours', href: p('hostshop', 'hours'), icon: Clock },
    { id: 'competencies', label: 'Competencies', href: p('hostshop', 'competencies'), icon: ClipboardCheck },
    { id: 'wages', label: 'Wage Compliance', href: p('hostshop', 'wages'), icon: BarChart3 },
    { id: 'documents', label: 'Documents', href: p('hostshop', 'documents'), icon: FileText },
    { id: 'mou', label: 'MOU', href: '/host-shop/onboarding/mou', icon: ClipboardList },
  ] }],
  instructor: [{ id: 'instruction', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('instructor'), icon: LayoutDashboard },
    { id: 'students', label: 'Students', href: p('instructor', 'students'), icon: Users },
    { id: 'courses', label: 'Courses', href: p('instructor', 'courses'), icon: BookOpen },
    { id: 'attendance', label: 'Attendance', href: p('instructor', 'attendance'), icon: Calendar },
  ] }],
  staff: [{ id: 'staff', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('staff'), icon: LayoutDashboard },
    { id: 'students', label: 'Students', href: p('staff', 'students'), icon: Users },
    { id: 'courses', label: 'Courses', href: p('staff', 'courses'), icon: BookOpen },
    { id: 'reports', label: 'Reports', href: p('admin', 'reports'), icon: BarChart3 },
  ] }],
  testing: [{ id: 'testing', items: [
    { id: 'dashboard', label: 'Testing Center', href: p('testing'), icon: ClipboardCheck },
  ] }],
  admin: [{ id: 'main', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('admin'), icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', href: p('admin', 'applications'), icon: FileText },
    { id: 'students', label: 'Students', href: p('admin', 'students'), icon: Users },
    { id: 'programs', label: 'Programs', href: p('admin', 'programs'), icon: BookOpen },
    { id: 'crm', label: 'CRM', href: p('admin', 'crm'), icon: Activity },
    { id: 'compliance', label: 'Compliance', href: p('admin', 'compliance'), icon: Shield },
    { id: 'studio', label: 'Studio', href: p('admin', 'studio'), icon: Settings },
    { id: 'testing', label: 'Testing Center', href: p('testing'), icon: ClipboardCheck },
    { id: 'health', label: 'System Health', href: p('admin', 'system-health'), icon: Activity },
  ] }],
  workforce: [{ id: 'workforce', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('workforce'), icon: LayoutDashboard },
    { id: 'participants', label: 'Participants', href: p('workforce', 'participants'), icon: Users },
  ] }],
  parent: [{ id: 'parent', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('parent'), icon: LayoutDashboard },
  ] }],
  case_manager: [{ id: 'case-manager', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('casemanager'), icon: LayoutDashboard },
    { id: 'participants', label: 'Participants', href: p('casemanager', 'participants'), icon: Users },
    { id: 'placements', label: 'Placements', href: p('casemanager', 'placements'), icon: Briefcase },
    { id: 'analytics', label: 'Analytics', href: p('casemanager', 'analytics'), icon: BarChart3 },
    { id: 'wioa-report', label: 'WIOA Reporting', href: p('casemanager', 'reports/wioa'), icon: FileText },
  ] }],
  workforce_board: [{ id: 'workforce-board', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('workforceboard'), icon: LayoutDashboard },
    { id: 'employment', label: 'Employment Outcomes', href: p('workforceboard', 'employment'), icon: Briefcase },
  ] }],
  program_holder: [{ id: 'program-holder', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('programholder'), icon: LayoutDashboard },
  ] }],
  provider: [{ id: 'provider', items: [
    { id: 'dashboard', label: 'Dashboard', href: p('provider'), icon: LayoutDashboard },
    { id: 'programs', label: 'Programs', href: p('provider', 'programs'), icon: BookOpen },
    { id: 'compliance', label: 'Compliance', href: p('provider', 'compliance'), icon: Shield },
    { id: 'settings', label: 'Settings', href: p('provider', 'settings'), icon: Settings },
  ] }],
  creator: [{ id: 'creator', items: [
    { id: 'products', label: 'Creator Studio', href: p('creator'), icon: Palette },
  ] }],
};

const ROLE_TO_NAVIGATION: Readonly<Record<UserRole, NavigationRole>> = {
  student: 'student', learner: 'student', user: 'student', delegate: 'student', grant_client: 'student',
  apprentice: 'apprentice', barber_apprentice: 'apprentice', cosmetology_apprentice: 'apprentice',
  instructor: 'instructor', employer: 'employer', sponsor: 'employer', recruiter: 'employer',
  partner: 'host_shop', partner_admin: 'host_shop', host_shop: 'host_shop', host_shop_admin: 'host_shop', mentor: 'host_shop',
  staff: 'staff', case_manager: 'case_manager', workforce: 'workforce', workforce_partner: 'workforce',
  workforce_board: 'workforce_board', workforce_board_admin: 'workforce_board', government: 'workforce_board',
  program_holder: 'program_holder', provider: 'provider', provider_admin: 'provider', creator: 'creator', parent: 'parent',
  admin: 'admin', org_admin: 'admin', super_admin: 'admin', advisor: 'admin', financial_aid: 'admin', compliance: 'admin', dev_studio: 'admin',
  test_admin: 'testing', proctor: 'testing', testing_center: 'testing',
};

export function getNavigationRole(role: UserRole): NavigationRole { return ROLE_TO_NAVIGATION[role] ?? 'student'; }
export function getNavigationForRole(role: UserRole): NavSection[] { return ROLE_NAVIGATION[getNavigationRole(role)]; }
export function getFlatNavItems(role: UserRole): NavItem[] { return getNavigationForRole(role).flatMap((section) => section.items); }

export function isActiveNavItem(href: string, pathname: string): boolean {
  try {
    const url = new URL(href, 'https://local.invalid');
    return pathname === url.pathname || pathname.startsWith(`${url.pathname}/`);
  } catch {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
}

export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (!pathname) return [];
  const segments = pathname.split('/').filter(Boolean);
  let currentPath = '';
  return segments.map((segment, index) => {
    currentPath += `/${segment}`;
    const label = segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { label, href: index < segments.length - 1 ? currentPath : undefined };
  });
}

const NAVIGATION_DISPLAY_NAMES: Record<NavigationRole, string> = {
  student: 'Student Portal', apprentice: 'Apprentice Portal', instructor: 'Instructor Portal', employer: 'Employer Portal',
  host_shop: 'Host Shop Portal', staff: 'Staff Portal', case_manager: 'Case Manager', workforce: 'Workforce Portal',
  workforce_board: 'Workforce Board', program_holder: 'Program Holder', provider: 'Provider Portal', creator: 'Creator Studio', parent: 'Parent Portal',
  admin: 'Admin', testing: 'Testing Center',
};

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = Object.fromEntries(
  (Object.keys(ROLE_TO_NAVIGATION) as UserRole[]).map((role) => [role, NAVIGATION_DISPLAY_NAMES[ROLE_TO_NAVIGATION[role]]]),
) as Record<UserRole, string>;

export const ROLE_DEFAULT_ACTIONS: Partial<Record<UserRole, ActionItem[]>> = {
  admin: [{ id: 'applications', label: 'Applications', href: p('admin', 'applications'), variant: 'secondary' }],
  student: [{ id: 'courses', label: 'My Courses', href: p('lms', 'courses'), variant: 'secondary' }],
  apprentice: [{ id: 'clock-in', label: 'Clock In', href: p('apprentice', 'timeclock'), icon: Clock, variant: 'primary' }],
  employer: [{ id: 'post-job', label: 'Post Job', href: p('employer', 'post-job'), icon: Plus, variant: 'primary' }],
};
