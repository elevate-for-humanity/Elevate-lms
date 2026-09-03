/**
 * ENTERPRISE NAVIGATION CONFIG
 *
 * Rules:
 * - Maximum 5 top-level items (pre-login)
 * - ONE CTA (Apply Now)
 * - Login in top-right corner (unobtrusive)
 * - Two-phase: Pre-intent vs Post-intent
 * - Benefit-driven labels
 */

import { getRoleDestination } from '@/lib/auth/role-destinations';

export type NavItem = {
  label: string;
  href: string;
};

export type NavSection = {
  label: string;
  href?: string;
  items?: NavItem[];
};

export const preIntentNav: NavSection[] = [
  {
    label: 'Programs',
    items: [
      { label: 'Healthcare', href: '/programs#healthcare' },
      { label: 'Skilled Trades', href: '/programs#trades' },
      { label: 'Transportation', href: '/programs#transportation' },
      { label: 'Business & Recovery', href: '/programs#business' },
      { label: 'Workforce Readiness', href: '/programs/workforce-readiness' },
      { label: 'View All Programs', href: '/programs' },
    ],
  },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'About', href: '/about' },
];

export const postIntentNav: NavSection[] = [
  {
    label: 'Programs',
    items: [
      { label: 'Healthcare', href: '/programs#healthcare' },
      { label: 'Skilled Trades', href: '/programs#trades' },
      { label: 'Transportation', href: '/programs#transportation' },
      { label: 'Business & Recovery', href: '/programs#business' },
      { label: 'Workforce Readiness', href: '/programs/workforce-readiness' },
      { label: 'View All Programs', href: '/programs' },
    ],
  },
  { label: 'My Dashboard', href: '/dashboard' },
  {
    label: 'Resources',
    items: [
      { label: 'Student Support', href: '/support' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Technical Help', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
];

export function getDashboardUrl(user: { role?: string } | null): string {
  if (!user?.role) return '/lms/dashboard';
  return getRoleDestination(user.role);
}

export function getEnterpriseNavigation(user?: { role?: string } | null): NavSection[] {
  if (user) {
    const nav = [...postIntentNav];
    const dashboardIndex = nav.findIndex((section) => section.label === 'My Dashboard');
    if (dashboardIndex !== -1) {
      nav[dashboardIndex] = {
        ...nav[dashboardIndex],
        href: getDashboardUrl(user),
      };
    }
    return nav;
  }
  return preIntentNav;
}

export const enterpriseNav = preIntentNav;
export default getEnterpriseNavigation;
