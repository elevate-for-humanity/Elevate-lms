/**
 * Simplified market entry: base plans + add-on marketplace.
 * Stripe checkout: POST /api/store/platform-checkout
 */

import type { PlatformFeatureKey } from '@/lib/platform/features';
import { PlatformFeature } from '@/lib/platform/features';

export type BasePlanId = 'solo' | 'business' | 'professional';
export type BillingInterval = 'monthly' | 'annual';

export interface BasePlanDefinition {
  id: BasePlanId;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  maxUsers: number;
  maxLocations: number;
  maxContacts: number | null;
  features: PlatformFeatureKey[];
  featureBullets: string[];
  popular?: boolean;
}

export interface AddOnDefinition {
  slug: string;
  name: string;
  priceMonthly: number;
  description: string;
  features: PlatformFeatureKey[];
  bullets: string[];
  /** Usage-based note shown in UI */
  usageNote?: string;
}

export const BASE_PLANS: Record<BasePlanId, BasePlanDefinition> = {
  solo: {
    id: 'solo',
    name: 'Solo',
    priceMonthly: 29,
    priceAnnual: 290,
    maxUsers: 1,
    maxLocations: 1,
    maxContacts: 100,
    features: [
      PlatformFeature.CRM,
      PlatformFeature.WEBSITE,
      PlatformFeature.BOOKING,
      PlatformFeature.FORMS,
      PlatformFeature.EMAIL_MARKETING,
      PlatformFeature.AI_BASIC,
    ],
    featureBullets: [
      '1 user',
      'Website',
      'Booking calendar',
      'CRM',
      '100 contacts',
      'Forms',
      'Email marketing',
      'Basic AI content generation',
      '1 business location',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    priceMonthly: 59,
    priceAnnual: 590,
    maxUsers: 3,
    maxLocations: 1,
    maxContacts: null,
    features: [
      PlatformFeature.CRM,
      PlatformFeature.WEBSITE,
      PlatformFeature.BOOKING,
      PlatformFeature.FORMS,
      PlatformFeature.EMAIL_MARKETING,
      PlatformFeature.AI_BASIC,
      PlatformFeature.AUTOMATIONS,
      PlatformFeature.INVOICING,
      PlatformFeature.LEAD_FUNNELS,
      PlatformFeature.CLIENT_PORTAL,
      PlatformFeature.SMS,
    ],
    featureBullets: [
      'Up to 3 users',
      'Everything in Solo',
      'Unlimited contacts',
      'Automations',
      'Invoicing',
      'Lead funnels',
      'Client portal',
      'SMS messaging',
    ],
    popular: true,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 99,
    priceAnnual: 990,
    maxUsers: 10,
    maxLocations: 1,
    maxContacts: null,
    features: [
      PlatformFeature.CRM,
      PlatformFeature.WEBSITE,
      PlatformFeature.BOOKING,
      PlatformFeature.FORMS,
      PlatformFeature.EMAIL_MARKETING,
      PlatformFeature.AI_BASIC,
      PlatformFeature.AUTOMATIONS,
      PlatformFeature.INVOICING,
      PlatformFeature.LEAD_FUNNELS,
      PlatformFeature.CLIENT_PORTAL,
      PlatformFeature.SMS,
      PlatformFeature.LMS,
      PlatformFeature.CERTIFICATES,
      PlatformFeature.WORKFLOW_AUTOMATION,
      PlatformFeature.REPORTING,
      PlatformFeature.CUSTOM_BRANDING,
    ],
    featureBullets: [
      'Up to 10 users',
      'Everything in Business',
      'LMS access',
      'Certificates',
      'Workflow automation',
      'Reporting dashboard',
      'Custom branding',
    ],
  },
};

export const ADD_ON_MARKETPLACE: AddOnDefinition[] = [
  {
    slug: 'ai-addon',
    name: 'AI Add-On',
    priceMonthly: 19,
    description: 'Advanced AI assistant, content, and chat widget.',
    features: [PlatformFeature.AI_ADVANCED, PlatformFeature.AI_CONTENT, PlatformFeature.AI_CHAT_WIDGET],
    bullets: ['Advanced AI assistant', 'AI content generation', 'AI chat widget'],
  },
  {
    slug: 'text-messaging',
    name: 'Text Messaging',
    priceMonthly: 15,
    description: 'SMS outreach with included bundle.',
    features: [PlatformFeature.SMS],
    bullets: ['500 SMS included', 'Additional usage billed separately'],
    usageNote: '500 SMS/mo included',
  },
  {
    slug: 'online-courses-lms',
    name: 'Online Courses / LMS',
    priceMonthly: 29,
    description: 'Courses, certificates, and student tracking.',
    features: [PlatformFeature.LMS, PlatformFeature.CERTIFICATES],
    bullets: ['Unlimited courses', 'Certificates', 'Student tracking'],
  },
  {
    slug: 'student-management',
    name: 'Student Management',
    priceMonthly: 49,
    description: 'Enrollment, attendance, and transcripts.',
    features: [PlatformFeature.STUDENT_MANAGEMENT],
    bullets: ['Enrollment management', 'Attendance', 'Progress tracking', 'Transcript records'],
  },
  {
    slug: 'workforce-development',
    name: 'Workforce Development',
    priceMonthly: 99,
    description: 'WIOA, SNAP E&T, case notes, and outcomes.',
    features: [PlatformFeature.WORKFORCE],
    bullets: ['WIOA tracking', 'SNAP E&T tracking', 'Case notes', 'Outcome reporting'],
  },
  {
    slug: 'apprenticeship-management',
    name: 'Apprenticeship Management',
    priceMonthly: 99,
    description: 'RAPIDS, OJT, employers, and hour verification.',
    features: [PlatformFeature.APPRENTICESHIP],
    bullets: ['RAPIDS tracking', 'OJT tracking', 'Employer management', 'Hours verification'],
  },
  {
    slug: 'employer-portal',
    name: 'Employer Portal',
    priceMonthly: 49,
    description: 'Jobs, applicants, and workforce requests.',
    features: [PlatformFeature.EMPLOYER_PORTAL],
    bullets: ['Job postings', 'Applicant tracking', 'Workforce requests'],
  },
  {
    slug: 'credential-testing-center',
    name: 'Credential Testing Center',
    priceMonthly: 49,
    description: 'Exam scheduling and credential tracking.',
    features: [PlatformFeature.TESTING_CENTER],
    bullets: ['Exam scheduling', 'Testing management', 'Credential tracking'],
  },
  {
    slug: 'white-label-mobile',
    name: 'White Label Mobile App',
    priceMonthly: 199,
    description: 'Branded mobile experience for learners and clients.',
    features: [PlatformFeature.WHITE_LABEL_MOBILE],
    bullets: ['Branded iOS/Android PWA', 'Push-ready architecture', 'Your logo and colors'],
  },
  {
    slug: 'additional-user',
    name: 'Additional User',
    priceMonthly: 10,
    description: 'Per-seat expansion beyond plan limits.',
    features: [],
    bullets: ['$10/month each', 'Adds one licensed seat'],
  },
  {
    slug: 'additional-location',
    name: 'Additional Location',
    priceMonthly: 25,
    description: 'Extra business location on your account.',
    features: [],
    bullets: ['$25/month each', 'Separate location settings'],
  },
  {
    slug: 'additional-storage',
    name: 'Additional Storage',
    priceMonthly: 10,
    description: 'Extra document and media storage.',
    features: [],
    bullets: ['$10/month per 100 GB', 'Documents and media'],
  },
];

export function getBasePlan(id: string): BasePlanDefinition | null {
  if (id in BASE_PLANS) return BASE_PLANS[id as BasePlanId];
  return null;
}

export function getAddOn(slug: string): AddOnDefinition | undefined {
  return ADD_ON_MARKETPLACE.find((a) => a.slug === slug);
}

export function priceCents(plan: BasePlanDefinition, interval: BillingInterval): number {
  const dollars = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
  return Math.round(dollars * 100);
}

export function addonPriceCents(addon: AddOnDefinition): number {
  return Math.round(addon.priceMonthly * 100);
}

export function licenseTierForPlan(planId: BasePlanId, interval: BillingInterval): string {
  return `${planId}_${interval}`;
}
