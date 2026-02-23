/**
 * Page Registry - Single Source of Truth for Navigation
 *
 * This file defines ALL pages that should be visible in the site navigation.
 * The header dropdown is auto-generated from this registry.
 * Daily audits check that every page listed here is accessible.
 */

import { programs } from './programs';

export type NavItem = {
  label: string;
  href: string;
  public?: boolean;  // default true - whether page is publicly accessible
  hidden?: boolean;  // default false - if true, excluded from nav (but still audited)
  description?: string; // optional description for mega menus
};

export type NavCategory = {
  label: string;
  key: string;
  items: NavItem[];
  featured?: NavItem[]; // optional featured items for mega menu
};

/**
 * Navigation Registry
 * Add all pages here - they will automatically appear in the header
 */
export const NAV_REGISTRY: NavCategory[] = [
  {
    label: 'Programs',
    key: 'programs',
    items: [
      // Auto-generated from programs.ts
      ...programs.map((p) => ({
        label: p.name,
        href: `/programs/${p.slug}`,
        description: p.shortDescription,
      })),
      // Static program pages
      { label: 'All Programs', href: '/programs', description: 'View all training programs' },
      { label: 'Micro Courses', href: '/micro-classes', description: 'Short certification courses' },
    ],
    // Featured programs for mega menu
    featured: [
      { label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
      { label: 'Building Technician with HVAC Fundamentals', href: '/programs/hvac-technician' },
      { label: 'Direct Support Professional', href: '/programs/direct-support-professional' },
    ],
  },
  {
    label: 'Students',
    key: 'students',
    items: [
      { label: 'Apply', href: '/apply', description: 'Start your application' },
      { label: 'Enroll', href: '/enroll', description: 'Enroll in a program' },
      { label: 'Funding Options', href: '/funding', description: 'WIOA, WRG, JRI, and more' },
      { label: 'How It Works', href: '/how-it-works', description: 'Our enrollment process' },
      { label: 'Student Dashboard', href: '/dashboard', public: false, description: 'Access your dashboard' },
      { label: 'Next Steps Checklist', href: '/dashboard/next-steps', public: false, description: 'Track your progress' },
    ],
  },
  {
    label: 'Partners',
    key: 'partners',
    items: [
      { label: 'Partner With Us', href: '/partners', description: 'Become a training partner' },
      { label: 'Employers', href: '/employers', description: 'Hire our graduates' },
      { label: 'Training Providers', href: '/training-providers', description: 'Partner as a provider' },
      { label: 'Workforce Boards', href: '/workforce-partners', description: 'Workforce board partnerships' },
      { label: 'License the Platform', href: '/platform', description: 'Deploy our platform' },
      { label: 'Platform Licensing', href: '/platform/licensing', description: 'Licensing options' },
    ],
  },
  {
    label: 'About',
    key: 'about',
    items: [
      { label: 'About Us', href: '/about', description: 'Our mission and story' },
      { label: 'Success Stories', href: '/success-stories', description: 'Student outcomes' },
      { label: 'Contact', href: '/contact', description: 'Get in touch' },
      { label: 'FAQ', href: '/faq', description: 'Frequently asked questions' },
      { label: 'Careers', href: '/careers', description: 'Join our team' },
    ],
  },
  {
    label: 'Resources',
    key: 'resources',
    items: [
      { label: 'Blog', href: '/blog', description: 'Latest news and updates' },
      { label: 'Help Center', href: '/help', description: 'Get support' },
      { label: 'Accessibility', href: '/accessibility', description: 'Accessibility statement' },
      { label: 'Privacy Policy', href: '/privacy-policy', description: 'How we protect your data' },
      { label: 'Terms of Service', href: '/terms-of-service', description: 'Terms and conditions' },
    ],
  },
];

/**
 * Flatten all nav items into a single array
 * Useful for auditing and sitemap generation
 */
export function getAllNavItems(): NavItem[] {
  const items: NavItem[] = [];

  for (const category of NAV_REGISTRY) {
    items.push(...category.items);
    if (category.featured) {
      items.push(...category.featured);
    }
  }

  // Remove duplicates by href
  const seen = new Set<string>();
  return items.filter((item: any) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

/**
 * Get all public pages (for sitemap generation)
 */
export function getPublicPages(): NavItem[] {
  return getAllNavItems().filter((item: any) => item.public !== false && !item.hidden);
}

/**
 * Get all pages that should be audited
 * Includes hidden pages to ensure they're not accidentally broken
 */
export function getAuditablePages(): NavItem[] {
  return getAllNavItems().filter((item: any) => item.public !== false);
}

/**
 * Get category by key
 */
export function getCategoryByKey(key: string): NavCategory | undefined {
  return NAV_REGISTRY.find((cat) => cat.key === key);
}

/**
 * Get all program pages
 */
export function getProgramPages(): NavItem[] {
  const programsCategory = getCategoryByKey('programs');
  return programsCategory?.items || [];
}
