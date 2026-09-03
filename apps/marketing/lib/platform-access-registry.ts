import { PORTAL_MAP, type PortalKey } from '@/lib/routing/portal-map';

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
    description: 'Review the registered barber apprenticeship structure, requirements, funding information and enrollment path.',
    href: 'https://www.elevateforhumanity.org/programs/barber-apprenticeship',
    action: 'Explore barber apprenticeship',
    surface: 'public',
  },
  {
    id: 'website-builder',
    name: 'Website Builder',
    description: 'Explore the website-building product, available capabilities and the path to create or connect a site.',
    href: 'https://www.elevateforhumanity.org/store',
    action: 'Explore website builder',
    surface: 'public',
  },
  {
    id: 'store',
    name: 'Plans, Products & Platform Access',
    description: 'Browse platform plans, add-ons, products and available subscription options before signing in or checking out.',
    href: 'https://www.elevateforhumanity.org/store#marketplace',
    action: 'Browse plans and products',
    surface: 'public',
  },
] as const;

export const SECURE_WORKSPACES: readonly PlatformAccessCard[] = [
  {
    id: 'website-builder-workspace',
    name: 'Website Builder Workspace',
    description: 'Open the authenticated editor for a website you own or are authorized to manage.',
    href: 'https://www.elevateforhumanity.org/apps/website-builder',
    action: 'Open website workspace',
    surface: 'authenticated',
  },
  {
    id: 'billing',
    name: 'Plans, Add-ons & Billing',
    description: 'Manage subscriptions, add-ons, trial conversion and billing from the authenticated account path.',
    href: 'https://www.elevateforhumanity.org/store/plans',
    action: 'Open billing and plans',
    surface: 'authenticated',
  },
] as const;

const DASHBOARD_IMAGES: Partial<Record<PortalKey, string>> = {
  lms: '/images/pages/training-classroom.webp',
  apprentice: '/images/pages/apprenticeship-structure.webp',
  hostshop: '/images/pages/barber-training.webp',
  programholder: '/images/pages/business-meeting.webp',
};

function portalCard(key: PortalKey, surface: AccessSurface): PlatformAccessCard {
  const portal = PORTAL_MAP[key];
  return {
    id: key,
    name: portal.label,
    description: portal.description,
    href: `${portal.host}${portal.defaultPath}`,
    action: `Open ${portal.label}`,
    surface,
    image: DASHBOARD_IMAGES[key],
  };
}

const PRIMARY_DASHBOARD_KEYS: readonly PortalKey[] = ['lms', 'apprentice', 'hostshop', 'programholder'];
const OPERATIONAL_PORTAL_KEYS: readonly PortalKey[] = [
  'admin', 'employer', 'parent', 'workforce', 'creator', 'instructor', 'staff',
  'testing', 'workforceboard', 'casemanager', 'provider',
];

export const DASHBOARD_WORKSPACES: readonly PlatformAccessCard[] = PRIMARY_DASHBOARD_KEYS.map((key) =>
  portalCard(key, 'authenticated'),
);

export const STAFF_AND_PARTNER_PORTALS: readonly PlatformAccessCard[] = OPERATIONAL_PORTAL_KEYS.map((key) =>
  portalCard(key, 'role'),
);

export const CANONICAL_PORTAL_ACCESS: readonly PlatformAccessCard[] = (
  Object.keys(PORTAL_MAP) as PortalKey[]
).map((key) => portalCard(key, 'role'));

const ALL_MARKETING_ACCESS_CARDS = [
  ...PUBLIC_EXPERIENCES,
  ...SECURE_WORKSPACES,
  ...DASHBOARD_WORKSPACES,
  ...STAFF_AND_PARTNER_PORTALS,
];

for (const card of ALL_MARKETING_ACCESS_CARDS) {
  if (/\/lms\/courses\//i.test(card.href)) {
    throw new Error(`Marketing access registry cannot link directly to an LMS course: ${card.id}`);
  }
  if (/\b(proof|pwa|production proof)\b/i.test(card.name)) {
    throw new Error(`Marketing card name uses internal implementation language: ${card.id}`);
  }
}
