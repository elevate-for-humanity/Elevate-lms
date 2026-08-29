import { ADD_ON_MARKETPLACE, BASE_PLANS } from '@/lib/store/platform-pricing';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

export type CommerceCategory =
  | 'platform'
  | 'app'
  | 'ai'
  | 'education'
  | 'workforce'
  | 'operations'
  | 'enterprise';

export interface CommerceCatalogItem {
  id: string;
  name: string;
  description: string;
  category: CommerceCategory;
  href: string;
  priceLabel?: string;
  billingType: 'subscription' | 'addon' | 'license' | 'contact' | 'included';
  status: 'sellable' | 'preview' | 'enterprise';
  keywords: string[];
}

const individualApps: CommerceCatalogItem[] = Object.values(INDIVIDUAL_APP_CATALOG).map((app) => {
  const lowest = Math.min(...app.plans.map((plan) => plan.priceMonthly));
  return {
    id: app.slug,
    name: app.displayName,
    description: app.tagline,
    category: 'app',
    href: `/store/apps/${app.slug}`,
    priceLabel: `From $${lowest}/mo`,
    billingType: 'subscription',
    status: 'sellable',
    keywords: [app.slug, app.displayName.toLowerCase()],
  };
});

const addOns: CommerceCatalogItem[] = ADD_ON_MARKETPLACE.map((addon) => ({
  id: addon.slug,
  name: addon.name,
  description: addon.description,
  category:
    addon.slug.includes('workforce') ||
    addon.slug.includes('apprenticeship') ||
    addon.slug.includes('employer')
      ? 'workforce'
      : addon.slug.includes('lms') ||
          addon.slug.includes('student') ||
          addon.slug.includes('testing')
        ? 'education'
        : addon.slug.includes('ai')
          ? 'ai'
          : 'operations',
  href: '/store/plans',
  priceLabel: `$${addon.priceMonthly}/mo`,
  billingType: 'addon',
  status: 'sellable',
  keywords: [addon.slug, addon.name.toLowerCase()],
}));

const platformPlans: CommerceCatalogItem[] = Object.values(BASE_PLANS).map((plan) => ({
  id: `plan-${plan.id}`,
  name: `${plan.name} Platform`,
  description: plan.featureBullets.slice(0, 4).join(' · '),
  category: 'platform',
  href: '/store/plans',
  priceLabel: `$${plan.priceMonthly}/mo`,
  billingType: 'subscription',
  status: 'sellable',
  keywords: [plan.id, `${plan.name.toLowerCase()} plan`, 'platform'],
}));

const platformProducts: CommerceCatalogItem[] = [
  {
    id: 'standalone-platform-builds',
    name: 'Standalone Website & Learning Platform Builds',
    description:
      'Independent branded deployments with website builder, unlimited-course builder, course runner, client portal and PARIS.',
    category: 'enterprise',
    href: '/store/implementation-packages',
    priceLabel: 'From $750 down',
    billingType: 'license',
    status: 'sellable',
    keywords: [
      'standalone website',
      'course builder',
      'unlimited courses',
      'client portal',
      'paris',
      'white label',
      'implementation',
    ],
  },
  {
    id: 'ai-assistants',
    name: 'AI Assistants',
    description:
      'Role-based AI assistance for admissions, student support, operations, compliance, and routing.',
    category: 'ai',
    href: '/store/ai-assistants',
    billingType: 'addon',
    status: 'preview',
    keywords: ['paris', 'pars', 'ellie', 'lizzy', 'zora', 'virtual assistant', 'ai assistant'],
  },
  {
    id: 'ai-studio',
    name: 'AI Studio',
    description: 'AI-assisted content and media workflows for training organizations.',
    category: 'ai',
    href: '/store/ai-studio',
    billingType: 'contact',
    status: 'preview',
    keywords: ['ai studio', 'content generation', 'media'],
  },
  {
    id: 'course-builder',
    name: 'Course Builder',
    description:
      'Create and manage courses, modules, lessons, quizzes, and AI-assisted curriculum content.',
    category: 'education',
    href: '/store/course-builder',
    billingType: 'contact',
    status: 'preview',
    keywords: ['course builder', 'curriculum', 'quizzes', 'lessons'],
  },
  {
    id: 'dev-studio',
    name: 'Dev Studio',
    description:
      'Unified development, deployment, health, workflow, container, and AI operations workspace.',
    category: 'operations',
    href: '/store/dev-studio',
    billingType: 'contact',
    status: 'enterprise',
    keywords: ['dev studio', 'deployments', 'containers', 'workflows'],
  },
  {
    id: 'testing-center',
    name: 'Testing Center',
    description:
      'Testing operations, scheduling, credential tracking, and related testing workflows.',
    category: 'education',
    href: '/store/testing',
    billingType: 'addon',
    status: 'sellable',
    keywords: ['testing center', 'proctoring', 'credentials', 'exam scheduling'],
  },
  {
    id: 'integrations',
    name: 'Integrations',
    description: 'Connect platform workflows with supported external systems and services.',
    category: 'operations',
    href: '/store/integrations',
    billingType: 'contact',
    status: 'enterprise',
    keywords: ['integrations', 'api', 'connectors'],
  },
  {
    id: 'workflow-studio',
    name: 'Workflow Studio',
    description: 'Workflow and automation tooling for operational processes.',
    category: 'operations',
    href: '/store/workflow-studio',
    billingType: 'contact',
    status: 'enterprise',
    keywords: ['workflow studio', 'automation', 'operations'],
  },
  {
    id: 'platform-licensing',
    name: 'Platform Licensing',
    description:
      'Managed and enterprise licensing options for organizations that need broader deployment and support.',
    category: 'enterprise',
    href: '/store/licenses',
    billingType: 'license',
    status: 'enterprise',
    keywords: ['license', 'managed platform', 'enterprise', 'white label'],
  },
  {
    id: 'course-licensing',
    name: 'Course Licensing',
    description: 'Licensable training content and course packages for organizations.',
    category: 'enterprise',
    href: '/store/courses',
    billingType: 'license',
    status: 'enterprise',
    keywords: ['course license', 'curriculum license', 'training content'],
  },
];

export const COMMERCE_CATALOG: CommerceCatalogItem[] = [
  ...platformPlans,
  ...individualApps,
  ...addOns,
  ...platformProducts,
];

export function getCommerceItem(id: string): CommerceCatalogItem | undefined {
  return COMMERCE_CATALOG.find((item) => item.id === id);
}

export function getCommerceItemsByCategory(category: CommerceCategory): CommerceCatalogItem[] {
  return COMMERCE_CATALOG.filter((item) => item.category === category);
}
