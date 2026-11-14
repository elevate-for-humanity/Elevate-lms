/**
 * Host Shop Feature Mapping to Store Plans & Add-ons
 * 
 * Maps Host Shop dashboard features to existing store products:
 * - Solo/Business/Professional/Enterprise base plans
 * - Apprenticeship Management add-on
 * - Student Management add-on
 * - Employer Portal add-on
 * - LMS add-on
 * - AI Add-On
 * - Text Messaging add-on
 */

import type { FeatureKey } from '@/lib/subscriptions/feature-access';
import { LAUNCH_PLANS } from './launch-plans';

export type HostShopTier = 'starter' | 'professional' | 'enterprise';

export interface HostShopFeatureMapping {
  /** Store product slug for this tier */
  basePlanSlug: string;
  /** Required add-on slugs */
  requiredAddons: string[];
  /** Optional add-on slugs */
  optionalAddons: string[];
  /** Feature keys enabled at this tier */
  enabledFeatures: FeatureKey[];
}

// Host Shop feature mappings to store products
export const HOST_SHOP_FEATURE_MAPPINGS: Record<HostShopTier, HostShopFeatureMapping> = {
  starter: {
    basePlanSlug: 'solo', // $29/mo - basic access
    requiredAddons: [
      'apprenticeship-management', // $99/mo - core apprenticeship features
      'student-management', // $49/mo - student tracking
    ],
    optionalAddons: [],
    enabledFeatures: [
      'host_apprentice_management',
      'host_hours_approval',
      'host_messaging',
      'host_reports_basic',
    ],
  },
  professional: {
    basePlanSlug: 'professional', // $99/mo
    requiredAddons: [
      'apprenticeship-management', // $99/mo
      'student-management', // $49/mo
      'employer-portal', // $49/mo
      'lms', // $29/mo
    ],
    optionalAddons: [
      'ai-addon', // $19/mo
      'text-messaging', // $15/mo
    ],
    enabledFeatures: [
      'host_apprentice_management',
      'host_hours_approval',
      'host_competency_signoff',
      'host_evaluations',
      'host_documents',
      'host_reports_basic',
      'host_reports_advanced',
      'host_messaging',
      'host_schedule',
      'host_ai_evaluations',
      'host_compliance_exports',
    ],
  },
  enterprise: {
    basePlanSlug: 'enterprise', // $999/mo
    requiredAddons: [
      'apprenticeship-management',
      'student-management',
      'employer-portal',
      'lms',
      'white-label-mobile-app', // $199/mo
    ],
    optionalAddons: [
      'ai-addon',
      'text-messaging',
      'additional-location', // $25/mo
      'additional-user', // $10/mo
      'additional-storage', // $10/mo per 100GB
    ],
    enabledFeatures: [
      'host_apprentice_management',
      'host_hours_approval',
      'host_competency_signoff',
      'host_evaluations',
      'host_documents',
      'host_reports_basic',
      'host_reports_advanced',
      'host_messaging',
      'host_schedule',
      'host_ai_evaluations',
      'host_compliance_exports',
      'host_multi_location',
      'host_store_access',
    ],
  },
};

// Add-on product definitions (matches store)
export interface StoreAddOn {
  slug: string;
  name: string;
  price: number;
  description: string;
  category: 'core' | 'ai' | 'communication' | 'scaling';
}

export const HOST_SHOP_ADDONS: StoreAddOn[] = [
  {
    slug: 'apprenticeship-management',
    name: 'Apprenticeship Management',
    price: 99,
    description: 'Full apprenticeship tracking, competency sign-offs, evaluations, and state compliance reporting.',
    category: 'core',
  },
  {
    slug: 'student-management',
    name: 'Student Management',
    price: 49,
    description: 'Student profiles, enrollment tracking, attendance, and progress monitoring.',
    category: 'core',
  },
  {
    slug: 'employer-portal',
    name: 'Employer Portal',
    price: 49,
    description: 'Host shop dashboard for employers to manage their apprentices.',
    category: 'core',
  },
  {
    slug: 'lms',
    name: 'Online Courses / LMS',
    price: 29,
    description: 'Access to the Learning Management System with video courses and training materials.',
    category: 'core',
  },
  {
    slug: 'ai-addon',
    name: 'AI Add-On',
    price: 19,
    description: 'AI-powered evaluation writing, progress summaries, and intelligent recommendations.',
    category: 'ai',
  },
  {
    slug: 'text-messaging',
    name: 'Text Messaging',
    price: 15,
    description: 'SMS notifications for appointments, reminders, and announcements.',
    category: 'communication',
  },
  {
    slug: 'white-label-mobile-app',
    name: 'White Label Mobile App',
    price: 199,
    description: 'Custom-branded mobile app for your organization.',
    category: 'scaling',
  },
  {
    slug: 'additional-user',
    name: 'Additional User',
    price: 10,
    description: 'Add another user seat to your subscription.',
    category: 'scaling',
  },
  {
    slug: 'additional-location',
    name: 'Additional Location',
    price: 25,
    description: 'Add another location to your multi-location setup.',
    category: 'scaling',
  },
  {
    slug: 'additional-storage',
    name: 'Additional Storage',
    price: 10,
    description: '100 GB additional storage per month.',
    category: 'scaling',
  },
];

// Map store product slugs to feature access
export function getFeaturesFromPurchasedAddons(purchasedSlugs: string[]): FeatureKey[] {
  const features: Set<FeatureKey> = new Set();
  
  // Core features from apprenticeship management
  if (purchasedSlugs.includes('apprenticeship-management')) {
    features.add('host_apprentice_management');
    features.add('host_hours_approval');
    features.add('host_competency_signoff');
    features.add('host_evaluations');
    features.add('host_schedule');
    features.add('host_compliance_exports');
  }
  
  // Core features from student management
  if (purchasedSlugs.includes('student-management')) {
    features.add('host_documents');
  }
  
  // Core features from employer portal
  if (purchasedSlugs.includes('employer-portal')) {
    features.add('host_store_access');
  }
  
  // Basic messaging
  features.add('host_messaging');
  features.add('host_reports_basic');
  
  // AI features
  if (purchasedSlugs.includes('ai-addon')) {
    features.add('host_ai_evaluations');
    features.add('host_reports_advanced');
  }
  
  // Multi-location for enterprise
  if (purchasedSlugs.includes('additional-location')) {
    features.add('host_multi_location');
  }
  
  return Array.from(features);
}

// Calculate pricing for a Host Shop tier
export function calculateHostShopPrice(tier: HostShopTier): {
  basePrice: number;
  addonPrice: number;
  totalPrice: number;
  basePlanName: string;
  addonNames: string[];
} {
  const mapping = HOST_SHOP_FEATURE_MAPPINGS[tier];
  const basePlan = LAUNCH_PLANS[mapping.basePlanSlug as keyof typeof LAUNCH_PLANS];
  
  let addonPrice = 0;
  const addonNames: string[] = [];
  
  for (const addonSlug of [...mapping.requiredAddons, ...mapping.optionalAddons]) {
    const addon = HOST_SHOP_ADDONS.find(a => a.slug === addonSlug);
    if (addon) {
      addonPrice += addon.price;
      addonNames.push(addon.name);
    }
  }
  
  return {
    basePrice: basePlan?.priceMonthly ?? 0,
    addonPrice,
    totalPrice: (basePlan?.priceMonthly ?? 0) + addonPrice,
    basePlanName: basePlan?.name ?? mapping.basePlanSlug,
    addonNames,
  };
}

// Get recommended tier based on features needed
export function getRecommendedTier(requiredFeatures: FeatureKey[]): HostShopTier {
  const enterpriseFeatures = HOST_SHOP_FEATURE_MAPPINGS.enterprise.enabledFeatures;
  const professionalFeatures = HOST_SHOP_FEATURE_MAPPINGS.professional.enabledFeatures;
  
  const hasEnterpriseFeature = requiredFeatures.some(f => enterpriseFeatures.includes(f));
  const hasProfessionalFeature = requiredFeatures.some(f => professionalFeatures.includes(f));
  
  if (hasEnterpriseFeature) return 'enterprise';
  if (hasProfessionalFeature) return 'professional';
  return 'starter';
}
