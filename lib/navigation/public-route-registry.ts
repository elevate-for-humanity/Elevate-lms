import { ROUTES } from '@/lib/navigation/routes';

export const PUBLIC_SITE_ORIGIN = 'https://www.elevateforhumanity.org' as const;

export type PublicRouteCategory =
  | 'Main'
  | 'Programs'
  | 'Apprenticeships'
  | 'Funding'
  | 'Employers'
  | 'Testing'
  | 'Platform'
  | 'Store'
  | 'About'
  | 'Legal';

export type PublicRouteDefinition = {
  path: string;
  label: string;
  category: PublicRouteCategory;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
  lastModified: string;
  index: true;
};

const changed = '2026-08-29T00:00:00-04:00';

export const PUBLIC_ROUTE_REGISTRY: readonly PublicRouteDefinition[] = [
  { path: ROUTES.home, label: 'Home', category: 'Main', changeFrequency: 'weekly', priority: 1, lastModified: changed, index: true },
  { path: ROUTES.programs, label: 'All Programs', category: 'Programs', changeFrequency: 'weekly', priority: 0.95, lastModified: changed, index: true },
  { path: ROUTES.apply, label: 'Apply', category: 'Main', changeFrequency: 'monthly', priority: 0.95, lastModified: changed, index: true },

  { path: ROUTES.apprenticeships, label: 'Apprenticeships', category: 'Apprenticeships', changeFrequency: 'weekly', priority: 0.95, lastModified: changed, index: true },
  { path: ROUTES.apprenticeshipsHowItWorks, label: 'How Apprenticeships Work', category: 'Apprenticeships', changeFrequency: 'monthly', priority: 0.85, lastModified: changed, index: true },
  { path: ROUTES.programsBeauty, label: 'Barber & Beauty Apprenticeships', category: 'Apprenticeships', changeFrequency: 'weekly', priority: 0.95, lastModified: changed, index: true },
  { path: ROUTES.apprenticeshipsHostShop, label: 'Become a Host Shop', category: 'Apprenticeships', changeFrequency: 'weekly', priority: 0.9, lastModified: changed, index: true },
  { path: '/host-shops', label: 'Host Shops', category: 'Apprenticeships', changeFrequency: 'weekly', priority: 0.9, lastModified: changed, index: true },
  { path: ROUTES.apprenticeshipSponsor, label: 'Apprenticeship Sponsor', category: 'Apprenticeships', changeFrequency: 'monthly', priority: 0.85, lastModified: changed, index: true },

  { path: ROUTES.programsHealthcare, label: 'Healthcare Programs', category: 'Programs', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.programsCNA, label: 'CNA', category: 'Programs', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.programsMedicalAssistant, label: 'Medical Assistant', category: 'Programs', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.programsPhlebotomy, label: 'Phlebotomy', category: 'Programs', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.programsQMA, label: 'QMA', category: 'Programs', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.programsHVAC, label: 'HVAC Technician', category: 'Programs', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: '/programs/skilled-trades', label: 'Skilled Trades', category: 'Programs', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.programsCDL, label: 'CDL Training', category: 'Programs', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.programsBarber, label: 'Barber Apprenticeship', category: 'Programs', changeFrequency: 'weekly', priority: 0.95, lastModified: changed, index: true },
  { path: '/programs/barber-apprenticeship/apply', label: 'Apply for Barber Apprenticeship', category: 'Programs', changeFrequency: 'weekly', priority: 0.9, lastModified: changed, index: true },
  { path: '/programs/barber-apprenticeship/request-info', label: 'Barber Apprenticeship Information', category: 'Programs', changeFrequency: 'weekly', priority: 0.85, lastModified: changed, index: true },
  { path: ROUTES.programsCosmetology, label: 'Cosmetology Apprenticeship', category: 'Programs', changeFrequency: 'weekly', priority: 0.95, lastModified: changed, index: true },
  { path: ROUTES.programsEsthetician, label: 'Esthetician Apprenticeship', category: 'Programs', changeFrequency: 'weekly', priority: 0.95, lastModified: changed, index: true },
  { path: ROUTES.programsNailTech, label: 'Nail Technician Apprenticeship', category: 'Programs', changeFrequency: 'weekly', priority: 0.95, lastModified: changed, index: true },
  { path: ROUTES.programsTechnology, label: 'Technology Programs', category: 'Programs', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },

  { path: ROUTES.funding, label: 'Funding', category: 'Funding', changeFrequency: 'weekly', priority: 0.9, lastModified: changed, index: true },
  { path: ROUTES.fundingWIOA, label: 'WIOA / WorkOne', category: 'Funding', changeFrequency: 'monthly', priority: 0.85, lastModified: changed, index: true },
  { path: '/funding/wrg', label: 'Workforce Ready Grant', category: 'Funding', changeFrequency: 'monthly', priority: 0.85, lastModified: changed, index: true },
  { path: ROUTES.fundingJobReadyIndy, label: 'Job Ready Indy', category: 'Funding', changeFrequency: 'monthly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.fundingVocRehab, label: 'State Programs', category: 'Funding', changeFrequency: 'monthly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.scholarships, label: 'Scholarships', category: 'Funding', changeFrequency: 'monthly', priority: 0.75, lastModified: changed, index: true },
  { path: ROUTES.eligibility, label: 'Check Eligibility', category: 'Funding', changeFrequency: 'monthly', priority: 0.85, lastModified: changed, index: true },
  { path: '/tuition-fees', label: 'Tuition & Fees', category: 'Funding', changeFrequency: 'weekly', priority: 0.85, lastModified: changed, index: true },

  { path: ROUTES.employers, label: 'Employers', category: 'Employers', changeFrequency: 'monthly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.employersHireGraduates, label: 'Hire Graduates', category: 'Employers', changeFrequency: 'monthly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.forAgencies, label: 'For Agencies', category: 'Employers', changeFrequency: 'monthly', priority: 0.75, lastModified: changed, index: true },

  { path: '/platform', label: 'Platform', category: 'Platform', changeFrequency: 'weekly', priority: 0.9, lastModified: changed, index: true },
  { path: '/platform/providers', label: 'Training Providers & Program Holders', category: 'Platform', changeFrequency: 'monthly', priority: 0.85, lastModified: changed, index: true },
  { path: '/licenses/enterprise-review', label: 'Enterprise Review', category: 'Platform', changeFrequency: 'monthly', priority: 0.85, lastModified: changed, index: true },

  { path: ROUTES.testing, label: 'Testing Center', category: 'Testing', changeFrequency: 'weekly', priority: 0.9, lastModified: changed, index: true },

  { path: ROUTES.store, label: 'Store', category: 'Store', changeFrequency: 'weekly', priority: 0.9, lastModified: changed, index: true },
  { path: ROUTES.storeDemo, label: 'Platform Demo', category: 'Store', changeFrequency: 'weekly', priority: 0.85, lastModified: changed, index: true },
  { path: '/store/plans', label: 'Plans', category: 'Store', changeFrequency: 'weekly', priority: 0.85, lastModified: changed, index: true },
  { path: '/store/trial', label: 'Organization Trial', category: 'Store', changeFrequency: 'weekly', priority: 0.85, lastModified: changed, index: true },
  { path: '/store/apps/website-builder', label: 'Website Builder', category: 'Store', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: '/store/apps/sam-gov', label: 'SAM.gov App', category: 'Store', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: '/store/apps/grants', label: 'Grants App', category: 'Store', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: '/store/ai-assistants', label: 'AI Assistants', category: 'Store', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: '/store/course-builder', label: 'Course Builder', category: 'Store', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: '/store/dev-studio', label: 'Dev Studio', category: 'Store', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: '/store/ai-studio', label: 'AI Studio', category: 'Store', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: '/store/testing', label: 'Testing App', category: 'Store', changeFrequency: 'weekly', priority: 0.8, lastModified: changed, index: true },
  { path: '/store/practice-tests', label: 'Practice Tests', category: 'Store', changeFrequency: 'weekly', priority: 0.82, lastModified: changed, index: true },
  { path: '/store/guides', label: 'Store Guides', category: 'Store', changeFrequency: 'monthly', priority: 0.75, lastModified: changed, index: true },
  { path: '/store/guides/licensing', label: 'Platform Licensing Guide', category: 'Store', changeFrequency: 'monthly', priority: 0.82, lastModified: changed, index: true },
  { path: '/store/licenses', label: 'Platform Licenses', category: 'Store', changeFrequency: 'weekly', priority: 0.85, lastModified: changed, index: true },
  { path: '/store/compliance', label: 'Compliance Controls', category: 'Store', changeFrequency: 'monthly', priority: 0.8, lastModified: changed, index: true },
  { path: '/store/compliance/wioa', label: 'WIOA Reporting Tools', category: 'Store', changeFrequency: 'monthly', priority: 0.75, lastModified: changed, index: true },

  { path: ROUTES.about, label: 'About / Mission', category: 'About', changeFrequency: 'monthly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.aboutApprovals, label: 'Approvals', category: 'About', changeFrequency: 'monthly', priority: 0.9, lastModified: changed, index: true },
  { path: ROUTES.successStories, label: 'Success Stories', category: 'About', changeFrequency: 'monthly', priority: 0.75, lastModified: changed, index: true },
  { path: '/institutional-governance', label: 'Institutional Governance', category: 'About', changeFrequency: 'monthly', priority: 0.85, lastModified: changed, index: true },
  { path: ROUTES.contact, label: 'Contact', category: 'About', changeFrequency: 'monthly', priority: 0.8, lastModified: changed, index: true },
  { path: ROUTES.blog, label: 'Blog', category: 'About', changeFrequency: 'weekly', priority: 0.7, lastModified: changed, index: true },
  { path: ROUTES.faq, label: 'FAQ', category: 'About', changeFrequency: 'monthly', priority: 0.7, lastModified: changed, index: true },
  { path: '/partners', label: 'Partners', category: 'About', changeFrequency: 'monthly', priority: 0.8, lastModified: changed, index: true },

  { path: '/privacy', label: 'Privacy Policy', category: 'Legal', changeFrequency: 'yearly', priority: 0.5, lastModified: changed, index: true },
  { path: '/legal', label: 'Terms & Legal', category: 'Legal', changeFrequency: 'yearly', priority: 0.55, lastModified: changed, index: true },
  { path: '/accessibility', label: 'Accessibility', category: 'Legal', changeFrequency: 'yearly', priority: 0.55, lastModified: changed, index: true },
  { path: '/federal-compliance', label: 'Federal Compliance', category: 'Legal', changeFrequency: 'monthly', priority: 0.8, lastModified: changed, index: true },
  { path: '/compliance/center', label: 'Compliance Center', category: 'Legal', changeFrequency: 'monthly', priority: 0.8, lastModified: changed, index: true },
] as const;

export const PRIVATE_ROUTE_PREFIXES = [
  '/api/',
  '/admin',
  '/dashboard',
  '/account',
  '/login',
  '/logout',
  '/lms',
  '/apprentice',
  '/host-shop/dashboard',
  '/host-shop/onboarding',
  '/host-shop/orientation',
  '/host-shop/mou',
  '/employer/dashboard',
  '/workforce/dashboard',
  '/parent-portal',
  '/program-holder/dashboard',
  '/case-manager/dashboard',
  '/provider/dashboard',
  '/workforce-board/dashboard',
  '/staff-portal',
  '/instructor',
] as const;

export function publicRouteGroups() {
  const groups = new Map<PublicRouteCategory, PublicRouteDefinition[]>();
  for (const route of PUBLIC_ROUTE_REGISTRY) {
    const current = groups.get(route.category) ?? [];
    current.push(route);
    groups.set(route.category, current);
  }
  return groups;
}
