/**
 * v1 launch plans — Individual / Professional / School / Enterprise
 * @see docs/ELEVATE_OS_GAP_AUDIT.md
 */

import type { PlatformFeatureKey } from '@/lib/platform/features';
import { PlatformFeature } from '@/lib/platform/features';

export type LaunchPlanId = 'individual' | 'professional' | 'school' | 'enterprise';

export type BillingInterval = 'monthly' | 'annual';

export interface LaunchPlanDefinition {
  id: LaunchPlanId;
  name: string;
  audience: string;
  priceMonthly: number;
  priceAnnual: number;
  features: PlatformFeatureKey[];
  featureBullets: string[];
  popular?: boolean;
}

export const LAUNCH_PLANS: Record<LaunchPlanId, LaunchPlanDefinition> = {
  individual: {
    id: 'individual',
    name: 'Individual',
    audience: 'Barbers, coaches, tutors, solo instructors',
    priceMonthly: 49,
    priceAnnual: 490,
    features: [
      PlatformFeature.WEBSITE,
      PlatformFeature.BOOKING,
      PlatformFeature.FORMS,
      PlatformFeature.CRM,
      PlatformFeature.AI_BASIC,
      PlatformFeature.LMS,
    ],
    featureBullets: [
      'Website + booking',
      'Forms + basic CRM',
      '1 course',
      'AI assistant',
      '14-day trial',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    audience: 'Growing creators and small teams',
    priceMonthly: 99,
    priceAnnual: 990,
    popular: true,
    features: [
      PlatformFeature.WEBSITE,
      PlatformFeature.BOOKING,
      PlatformFeature.FORMS,
      PlatformFeature.CRM,
      PlatformFeature.AI_BASIC,
      PlatformFeature.LMS,
      PlatformFeature.AUTOMATIONS,
      PlatformFeature.REPORTING,
      PlatformFeature.CUSTOM_BRANDING,
    ],
    featureBullets: [
      'Everything in Individual',
      'Automations',
      'Unlimited courses',
      'Reporting',
      'Custom branding',
    ],
  },
  school: {
    id: 'school',
    name: 'School',
    audience: 'CNA, barber, CDL, and training schools',
    priceMonthly: 299,
    priceAnnual: 2990,
    features: [
      PlatformFeature.WEBSITE,
      PlatformFeature.LMS,
      PlatformFeature.CERTIFICATES,
      PlatformFeature.STUDENT_MANAGEMENT,
      PlatformFeature.REPORTING,
      PlatformFeature.AI_BASIC,
      PlatformFeature.TESTING_CENTER,
    ],
    featureBullets: [
      'Full LMS + student portal',
      'Enrollment + certificates',
      'Testing center',
      'AI course builder',
      'School reporting',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    audience: 'Workforce boards, agencies, large employers',
    priceMonthly: 999,
    priceAnnual: 9990,
    features: [
      PlatformFeature.WEBSITE,
      PlatformFeature.LMS,
      PlatformFeature.WORKFORCE,
      PlatformFeature.APPRENTICESHIP,
      PlatformFeature.REPORTING,
      PlatformFeature.CUSTOM_BRANDING,
      PlatformFeature.API_ACCESS,
    ],
    featureBullets: [
      'Multi-program workforce',
      'WIOA / apprenticeship',
      'White label',
      'Advanced reporting',
      'Dedicated support',
    ],
  },
};

/** Legacy checkout ids → launch plan */
export const PLAN_ID_ALIASES: Record<string, LaunchPlanId> = {
  solo: 'individual',
  business: 'individual',
  professional: 'professional',
  individual: 'individual',
  school: 'school',
  enterprise: 'enterprise',
};

export function resolveLaunchPlanId(id: string): LaunchPlanId | null {
  const key = PLAN_ID_ALIASES[id] ?? id;
  if (key in LAUNCH_PLANS) return key as LaunchPlanId;
  return null;
}

export function launchPlanPriceCents(plan: LaunchPlanDefinition, interval: BillingInterval): number {
  const dollars = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  return Math.round(dollars * 100);
}
