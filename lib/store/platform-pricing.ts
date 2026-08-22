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
  usageNote?: string;
  /** Keep legacy billing slugs resolvable without advertising duplicate products. */
  hiddenFromMarketplace?: boolean;
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
    name: 'AI Power Pack',
    priceMonthly: 19,
    description: 'Advanced AI content generation and embedded chat tools.',
    features: [PlatformFeature.AI_ADVANCED, PlatformFeature.AI_CONTENT, PlatformFeature.AI_CHAT_WIDGET],
    bullets: ['Advanced AI generation', 'AI content tools', 'AI chat widget'],
  },
  {
    slug: 'paris-assistant',
    name: 'PARIS Sales & Intake Assistant',
    priceMonthly: 19,
    description: 'Conversational lead qualification, intake, interviews and admissions support.',
    features: [PlatformFeature.AI_PARIS],
    bullets: ['Lead qualification', 'Conversational intake', 'Interview workflows', 'Sales and admissions guidance'],
  },
  {
    slug: 'ellie-assistant',
    name: 'ELLIE Learning & Support Assistant',
    priceMonthly: 19,
    description: 'Student, learner and customer support with course and enrollment guidance.',
    features: [PlatformFeature.AI_ELLIE],
    bullets: ['Learner support', 'Course guidance', 'Enrollment help', 'Knowledge assistance'],
  },
  {
    slug: 'lizzy-assistant',
    name: 'LIZZY Operations Assistant',
    priceMonthly: 29,
    description: 'Administrative operations, documents, queues and workflow assistance.',
    features: [PlatformFeature.AI_LIZZY],
    bullets: ['Operations support', 'Document assistance', 'Administrative queues', 'Workflow guidance'],
  },
  {
    slug: 'zora-assistant',
    name: 'ZORA Compliance Assistant',
    priceMonthly: 29,
    description: 'Compliance review, workforce documentation and audit assistance.',
    features: [PlatformFeature.AI_ZORA],
    bullets: ['Compliance review', 'WIOA/workforce support', 'Credential checks', 'Audit assistance'],
  },
  {
    slug: 'ai-team',
    name: 'AI Business Team',
    priceMonthly: 79,
    description: 'PARIS, ELLIE, LIZZY and ZORA with shared AI orchestration.',
    features: [
      PlatformFeature.AI_PARIS,
      PlatformFeature.AI_ELLIE,
      PlatformFeature.AI_LIZZY,
      PlatformFeature.AI_ZORA,
      PlatformFeature.AI_ORCHESTRATOR,
    ],
    bullets: ['PARIS', 'ELLIE', 'LIZZY', 'ZORA', 'Cross-agent task routing'],
  },
  {
    slug: 'ai-voice',
    name: 'AI Voice',
    priceMonthly: 15,
    description: 'Voice input and spoken assistant responses for supported AI experiences.',
    features: [PlatformFeature.AI_VOICE],
    bullets: ['Speech input', 'Spoken responses', 'Hands-free guided experiences'],
    usageNote: 'Provider usage limits may apply',
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
    slug: 'course-creation-learning-platform',
    name: 'Course Creation & Learning Platform',
    priceMonthly: 79,
    description: 'Build, generate, publish and deliver complete instructor-led courses from one unified workspace.',
    features: [
      PlatformFeature.COURSE_BUILDER,
      PlatformFeature.COURSE_FACTORY,
      PlatformFeature.AI_CONTENT,
      PlatformFeature.LMS,
      PlatformFeature.CERTIFICATES,
    ],
    bullets: [
      'Unified Course Builder',
      'AI blueprints, lessons and assessments',
      'AI instructor video and narration workflows',
      'Learner LMS delivery',
      'Certificates and student progress tracking',
      'Unlimited course structures',
    ],
    usageNote: 'AI media provider usage limits may apply',
  },
  {
    slug: 'online-courses-lms',
    name: 'Online Courses / LMS',
    priceMonthly: 29,
    description: 'Courses, certificates, and student tracking.',
    features: [PlatformFeature.LMS, PlatformFeature.CERTIFICATES],
    bullets: ['Unlimited courses', 'Certificates', 'Student tracking'],
    hiddenFromMarketplace: true,
  },
  {
    slug: 'community-hub',
    name: 'Community Hub',
    priceMonthly: 39,
    description: 'Branded community with posts, discussions, groups, events, memberships and gamification.',
    features: [
      PlatformFeature.COMMUNITY,
      PlatformFeature.COMMUNITY_GROUPS,
      PlatformFeature.COMMUNITY_EVENTS,
      PlatformFeature.COMMUNITY_GAMIFICATION,
      PlatformFeature.COMMUNITY_MEMBERSHIPS,
    ],
    bullets: [
      'Community feed and comments',
      'Groups and discussions',
      'Events and RSVP',
      'Points, badges and leaderboards',
      'Free and paid membership tiers',
      'AI Team community roles',
    ],
  },
  {
    slug: 'course-builder',
    name: 'Course Builder',
    priceMonthly: 29,
    description: 'Build and manage structured courses, lessons and curriculum.',
    features: [PlatformFeature.COURSE_BUILDER],
    bullets: ['Course structures', 'Lesson management', 'Curriculum workflows'],
    hiddenFromMarketplace: true,
  },
  {
    slug: 'ai-course-factory',
    name: 'AI Course Factory',
    priceMonthly: 49,
    description: 'Generate course blueprints, lessons and assessments with AI.',
    features: [PlatformFeature.COURSE_FACTORY, PlatformFeature.COURSE_BUILDER, PlatformFeature.AI_CONTENT],
    bullets: ['AI blueprints', 'Lesson generation', 'Assessment generation', 'Course Builder access'],
    hiddenFromMarketplace: true,
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
    description: 'Adds one licensed user beyond the base-plan limit.',
    features: [],
    bullets: ['Adds 1 licensed seat', 'Applied to your organization user limit'],
  },
  {
    slug: 'additional-location',
    name: 'Additional Location',
    priceMonthly: 25,
    description: 'Adds one business location beyond the base-plan limit.',
    features: [],
    bullets: ['Adds 1 business location', 'Applied to your organization location limit'],
  },
  {
    slug: 'additional-storage',
    name: 'Additional Storage',
    priceMonthly: 10,
    description: 'Adds 100 GB of document and media storage.',
    features: [],
    bullets: ['Adds 100 GB', 'Documents and media storage'],
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
