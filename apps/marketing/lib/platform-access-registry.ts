export type AccessSurface = 'public' | 'authenticated' | 'role';

export type PlatformAccessCard = {
  id: string;
  name: string;
  description: string;
  href: string;
  action: string;
  surface: AccessSurface;
  image?: string;
};

export const PUBLIC_EXPERIENCES: readonly PlatformAccessCard[] = [
  {
    id: 'barber-program',
    name: 'Barber Apprenticeship Program',
    description:
      'Review the registered barber apprenticeship structure, requirements, funding information and enrollment path.',
    href: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship',
    action: 'Explore barber apprenticeship',
    surface: 'public',
  },
  {
    id: 'website-builder',
    name: 'Website Builder',
    description:
      'Explore the website-building product, available capabilities and the path to create or connect a site.',
    href: 'https://www.elevateforhumanity.org/store',
    action: 'Explore website builder',
    surface: 'public',
  },
  {
    id: 'store',
    name: 'Plans, Products & Platform Access',
    description:
      'Browse platform plans, add-ons, products and available subscription options before signing in or checking out.',
    href: 'https://www.elevateforhumanity.org/store#marketplace',
    action: 'Browse plans and products',
    surface: 'public',
  },
] as const;

export const SECURE_WORKSPACES: readonly PlatformAccessCard[] = [
  {
    id: 'website-builder-workspace',
    name: 'Website Builder Workspace',
    description:
      'Open the authenticated editor for a website you own or are authorized to manage.',
    href: 'https://www.elevateforhumanity.org/apps/website-builder',
    action: 'Open website workspace',
    surface: 'authenticated',
  },
  {
    id: 'billing',
    name: 'Plans, Add-ons & Billing',
    description:
      'Manage subscriptions, add-ons, trial conversion and billing from the authenticated account path.',
    href: 'https://www.elevateforhumanity.org/store/plans',
    action: 'Open billing and plans',
    surface: 'authenticated',
  },
] as const;

export const DASHBOARD_WORKSPACES: readonly PlatformAccessCard[] = [
  {
    id: 'learner-dashboard',
    name: 'Learner Dashboard',
    description: 'Courses, assignments, progress, certificates, schedule and learner support.',
    href: 'https://app.elevateforhumanity.org/lms/dashboard',
    action: 'Sign in to learner dashboard',
    surface: 'authenticated',
    image: '/images/pages/training-classroom.webp',
  },
  {
    id: 'apprentice-dashboard',
    name: 'Apprentice Dashboard',
    description: 'OJT hours, RTI courses, competencies, documents and apprenticeship progress.',
    href: 'https://app.elevateforhumanity.org/apprentice',
    action: 'Sign in to apprentice dashboard',
    surface: 'authenticated',
    image: '/images/pages/apprenticeship-structure.webp',
  },
  {
    id: 'host-shop-dashboard',
    name: 'Host Shop Dashboard',
    description: 'Apprentices, hour approvals, attendance, competencies, documents and reporting.',
    href: 'https://app.elevateforhumanity.org/host-shop/dashboard',
    action: 'Sign in to host shop dashboard',
    surface: 'authenticated',
    image: '/images/pages/barber-training.webp',
  },
  {
    id: 'program-holder-dashboard',
    name: 'Program Holder Dashboard',
    description: 'Programs, students, hours, documents and compliance actions.',
    href: 'https://app.elevateforhumanity.org/program-holder/dashboard',
    action: 'Sign in to program holder dashboard',
    surface: 'authenticated',
    image: '/images/pages/business-meeting.webp',
  },
] as const;

export const STAFF_AND_PARTNER_PORTALS: readonly PlatformAccessCard[] = [
  ['admin', 'Admin', 'https://admin.elevateforhumanity.org/dashboard'],
  ['employer', 'Employer', 'https://app.elevateforhumanity.org/employer/dashboard'],
  ['parent', 'Parent', 'https://app.elevateforhumanity.org/parent-portal/dashboard'],
  ['workforce', 'Workforce', 'https://app.elevateforhumanity.org/workforce/dashboard'],
  ['creator', 'Creator Studio', 'https://app.elevateforhumanity.org/creator/products'],
  ['instructor', 'Instructor', 'https://admin.elevateforhumanity.org/instructor/dashboard'],
  ['staff', 'Staff', 'https://admin.elevateforhumanity.org/staff-portal/dashboard'],
  ['testing-center', 'Testing Center', 'https://admin.elevateforhumanity.org/testing-center'],
  ['workforce-board', 'Workforce Board', 'https://www.elevateforhumanity.org/workforce-board/dashboard'],
  ['case-manager', 'Case Manager', 'https://www.elevateforhumanity.org/case-manager/dashboard'],
  ['provider', 'Provider', 'https://www.elevateforhumanity.org/provider/dashboard'],
].map(([id, name, href]) => ({
  id,
  name,
  description: `Open the secure ${name} workspace. Access requires the matching authorization.`,
  href,
  action: `Open ${name} portal`,
  surface: 'role' as const,
}));

const ALL_MARKETING_ACCESS_CARDS = [
  ...PUBLIC_EXPERIENCES,
  ...SECURE_WORKSPACES,
  ...DASHBOARD_WORKSPACES,
  ...STAFF_AND_PARTNER_PORTALS,
];

// Marketing governance: public discovery pages may link to program pages and
// authenticated workspace entry points, but never directly to an individual
// learner course or curriculum record. Course discovery belongs to enrollment
// and dashboard authorization.
for (const card of ALL_MARKETING_ACCESS_CARDS) {
  if (/\/lms\/courses\//i.test(card.href)) {
    throw new Error(
      `Marketing access registry cannot link directly to an LMS course: ${card.id}`,
    );
  }

  if (/\b(proof|pwa|production proof)\b/i.test(card.name)) {
    throw new Error(
      `Marketing card name uses internal implementation language: ${card.id}`,
    );
  }
}
