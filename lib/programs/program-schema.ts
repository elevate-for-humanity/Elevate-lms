/**
 * Program Detail Template v1 — Canonical Schema
 *
 * HVAC Technician is the reference implementation.
 * Every program page MUST use this schema. The ProgramDetailPage component
 * enforces section order and rejects programs with missing required fields.
 *
 * Required sections (rendered in this order):
 *   A. Program Header Spec Panel (above the fold)
 *   B. Credentials Earned (3–6 credential cards with issuer)
 *   C. Program Outcomes (5–8 measurable competency statements)
 *   D. Career Pathway (visual ladder/timeline)
 *   E. Weekly Schedule (grid or accordion)
 *   F. Course Modules (module cards with objectives)
 *   G. Standards & Compliance Alignment
 *   H. Career Outcomes / Labor Market Info (attributed)
 *   I. CTA block (Apply + Talk to Advisor)
 *   J. Institutional footer + disclaimers
 */

import { getVerifiedProgramFunding } from './funding-registry';

export interface ProgramCredential {
  name: string;
  issuer: string;
  issuingBody?: string;
  description: string;
  validity?: string;
}

export interface ProgramOutcome {
  statement: string;
  assessedAt?: string;
}

export interface CareerPathwayStep {
  title: string;
  timeframe: string;
  requirements: string;
  salaryRange: string;
}

export interface WeeklyScheduleEntry {
  week: string;
  title: string;
  competencyMilestone: string;
}

export interface CurriculumModule {
  title: string;
  topics: string[];
}

export interface LaborMarketStats {
  medianSalary: number;
  salaryRange: string;
  growthRate: string;
  source: string;
  sourceYear: number;
  region: string;
}

export interface ComplianceAlignment {
  standard: string;
  description: string;
}

export interface CareerOutcome {
  title: string;
  salary: string;
}

export interface HoursBreakdown {
  onlineInstruction: number;
  handsOnLab: number;
  examPrep: number;
  careerPlacement: number;
}

export interface TrainingPhase {
  phase: number;
  title: string;
  weeks: string;
  focus: string;
  labCompetencies: string[];
}

export interface CredentialPipeline {
  training: string;
  certification: string;
  certBody: string;
  jobRole: string;
}

export type ProgramDeliveryModel = 'internal' | 'partner' | 'hybrid';
export type DeliveryModel = 'internal_lms' | 'partner_scorm' | 'external_redirect' | 'hybrid';
export type FundingType = 'wioa' | 'wrg' | 'impact' | 'self_pay' | 'employer_paid' | 'unknown';
export type EnrollmentType = 'internal' | 'external' | 'waitlist';
export type PartnerProvider =
  | 'hsi'
  | 'careersafe'
  | 'elevate-lms'
  | 'Elevate for Humanity'
  | 'jri'
  | 'employindy'
  | 'nrf'
  | 'milady'
  | null;

export interface AttachedCourse {
  courseId: string;
  label: string;
  partnerName: string;
  credentialIssued?: string;
  duration?: string;
  required: boolean;
  enrollmentUrl?: string;
}

export interface CTALinks {
  applyHref: string;
  enrollHref?: string;
  requestInfoHref?: string;
  careerConnectHref?: string;
  advisorHref?: string;
  courseHref?: string;
  stripeCheckoutHref?: string;
}

export interface ProgramSchema {
  slug: string;
  title: string;
  subtitle: string;
  sector: 'skilled-trades' | 'healthcare' | 'personal-services' | 'technology' | 'business';
  category: string;
  programType: 'workforce' | 'apprenticeship' | 'certification';

  heroImage: string;
  heroImageAlt: string;
  videoSrc?: string;
  voiceoverSrc?: string;

  deliveryMode: 'online' | 'hybrid' | 'in-person';
  deliveredBy?: 'Elevate' | 'Partner' | 'Elevate or Partner';
  durationWeeks: number;
  hoursPerWeekMin: number;
  hoursPerWeekMax: number;
  hoursBreakdown: HoursBreakdown;
  schedule: string;
  eveningSchedule?: string;
  cohortSize: string;
  fundingStatement: string;
  selfPayCost: string;
  regularPrice?: string;
  salePrice?: string;
  depositAmount?: string;
  isSelfPay?: boolean;

  facilityDetails?: {
    address: string;
    classSize: string;
    labEquipment?: string;
    instructors: {
      name: string;
      credential: string;
      experience: string;
    }[];
  };
  badge?: string;
  badgeColor?: 'red' | 'green' | 'blue' | 'orange' | 'purple';

  enrollmentTracks?: {
    funded: {
      label: string;
      requirement: string;
      description: string;
      applyHref: string;
      available: true;
    };
    selfPay: {
      label: string;
      cost: string;
      description: string;
      applyHref: string;
      available: boolean;
      comingSoonMessage?: string;
    };
  };

  credentials: ProgramCredential[];
  outcomes: ProgramOutcome[];
  careerPathway: CareerPathwayStep[];
  weeklySchedule: WeeklyScheduleEntry[];
  curriculum: CurriculumModule[];
  complianceAlignment: ComplianceAlignment[];
  trainingPhases?: TrainingPhase[];
  credentialPipeline?: CredentialPipeline[];
  laborMarket: LaborMarketStats;
  careers: CareerOutcome[];
  cta: CTALinks;
  programDescription?: string[];

  bnplOptions?: {
    headline: string;
    note: string;
    plans: {
      label: string;
      amount: string;
      detail: string;
    }[];
  };

  admissionRequirements?: string[];
  equipmentIncluded?: string;
  modality?: string;
  facilityInfo?: string;
  bilingualSupport?: string;
  employerPartners?: string[];
  pricingIncludes?: string[];
  paymentTerms?: string;

  deliveryModel?: ProgramDeliveryModel;
  deliveryModelDetail?: DeliveryModel;
  partnerProvider?: PartnerProvider;
  fundingOptions?: FundingType[];

  funding?: {
    fssa_eligible: boolean;
    snap_et_eligible?: boolean;
    wioa_eligible: boolean;
    etpl_approved?: boolean;
    wrg_eligible: boolean;
    jobReadyIndyEligible?: boolean;
    fundingNotes?: string;
  };

  active?: boolean;
  public_visible?: boolean;
  enrollmentType?: EnrollmentType;
  externalEnrollmentUrl?: string;
  lmsCourseSlug?: string;
  partnerCourses?: AttachedCourse[];
  microCourses?: AttachedCourse[];

  classBTrack?: {
    title: string;
    duration: string;
    durationWeeks: number;
    vehicles: string;
    opportunities: string;
    description: string;
    credentials: string[];
    fundingStatement?: string;
  };

  locations?: {
    city: string;
    state: string;
    status: 'active' | 'coming_soon';
    note?: string;
  }[];

  jobPlacement?: {
    headline: string;
    description: string;
    features: string[];
  };

  faqs: { question: string; answer: string }[];
  breadcrumbs: { label: string; href?: string }[];
  metaTitle: string;
  metaDescription: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateProgram(p: ProgramSchema): ValidationError[] {
  const errors: ValidationError[] = [];

  const minTotal = p.durationWeeks * p.hoursPerWeekMin;
  const maxTotal = p.durationWeeks * p.hoursPerWeekMax;
  const breakdownTotal =
    p.hoursBreakdown.onlineInstruction +
    p.hoursBreakdown.handsOnLab +
    p.hoursBreakdown.examPrep +
    p.hoursBreakdown.careerPlacement;

  if (breakdownTotal < minTotal || breakdownTotal > maxTotal) {
    errors.push({
      field: 'hoursBreakdown',
      message: `Hours breakdown (${breakdownTotal}) must be between ${minTotal}–${maxTotal} (${p.durationWeeks} weeks × ${p.hoursPerWeekMin}–${p.hoursPerWeekMax} hrs/week)`,
    });
  }

  if (p.credentials.length < 3) {
    errors.push({
      field: 'credentials',
      message: `Need at least 3 credentials, got ${p.credentials.length}`,
    });
  }
  if (p.credentials.length > 6) {
    errors.push({
      field: 'credentials',
      message: `Maximum 6 credentials, got ${p.credentials.length}`,
    });
  }
  for (const c of p.credentials) {
    if (!c.issuer) {
      errors.push({ field: 'credentials', message: `Credential "${c.name}" missing issuer` });
    }
  }

  if (p.outcomes.length < 5) {
    errors.push({
      field: 'outcomes',
      message: `Need at least 5 measurable outcomes, got ${p.outcomes.length}`,
    });
  }
  if (p.outcomes.length > 8) {
    errors.push({ field: 'outcomes', message: `Maximum 8 outcomes, got ${p.outcomes.length}` });
  }

  if (!p.careerPathway || p.careerPathway.length < 2) {
    errors.push({ field: 'careerPathway', message: `Need at least 2 career pathway steps` });
  }
  if (!p.weeklySchedule || p.weeklySchedule.length === 0) {
    errors.push({ field: 'weeklySchedule', message: 'Weekly schedule is empty' });
  }
  if (!p.complianceAlignment || p.complianceAlignment.length === 0) {
    errors.push({ field: 'complianceAlignment', message: 'Need at least 1 compliance alignment' });
  }
  if (!p.laborMarket?.source) {
    errors.push({ field: 'laborMarket', message: 'Labor market stats must include source' });
  }
  if (!p.laborMarket?.sourceYear) {
    errors.push({ field: 'laborMarket', message: 'Labor market stats must include source year' });
  }
  if (!p.employerPartners || p.employerPartners.length === 0) {
    errors.push({ field: 'employerPartners', message: 'Need at least 1 employer partner' });
  }

  return errors;
}

export interface PrimaryCTA {
  label: string;
  href: string;
  external: boolean;
}

export function getPrimaryCTA(p: ProgramSchema): PrimaryCTA | null {
  const type = p.enrollmentType ?? 'internal';

  if (type === 'external') {
    const url = p.externalEnrollmentUrl;
    if (!url) return null;
    return { label: 'Continue to Enrollment', href: url, external: true };
  }

  if (type === 'waitlist') {
    return {
      label: 'Join Waitlist',
      href: p.cta.requestInfoHref || `/programs/${p.slug}/request-info`,
      external: false,
    };
  }

  const href = p.cta.applyHref || `/apply?program=${p.slug}`;
  return { label: 'Apply Now', href, external: false };
}

export function getEnrollmentTracks(
  p: ProgramSchema,
): NonNullable<ProgramSchema['enrollmentTracks']> {
  const verified = getVerifiedProgramFunding(p.slug);
  const applyHref = p.cta.applyHref || `/apply?program=${p.slug}`;
  const fundedDescription = verified?.wrgEligible
    ? 'WIOA or Workforce Ready Grant may be considered. WorkOne or the responsible agency determines eligibility, covered costs, and written authorization before funded enrollment.'
    : verified?.wioaEligible
      ? 'WIOA may be considered. WorkOne or the responsible agency determines eligibility, covered costs, and written authorization before funded enrollment.'
      : 'This program is presented as self-pay; no public workforce-funding claim is made.';

  return {
    funded: {
      label: verified ? 'Workforce-Funding Consideration' : 'Self-Pay Program',
      requirement: verified
        ? 'Agency eligibility and written authorization required'
        : 'Review published self-pay options',
      description: fundedDescription,
      applyHref,
      available: true as const,
    },
    selfPay: {
      label: 'Self-Pay — All States',
      cost: p.selfPayCost,
      description:
        'Review the published tuition and currently available checkout options. Provider-specific installment terms are shown at checkout.',
      applyHref,
      available: p.enrollmentType !== 'waitlist',
      comingSoonMessage: 'Self-pay enrollment is opening soon. Join the waitlist to be notified.',
    },
  };
}

export function getTotalHoursRange(p: ProgramSchema): string {
  const min = p.durationWeeks * p.hoursPerWeekMin;
  const max = p.durationWeeks * p.hoursPerWeekMax;
  return min === max ? `${min} hours` : `${min}–${max} hours`;
}

export function getTotalHoursFromBreakdown(p: ProgramSchema): number {
  return (
    p.hoursBreakdown.onlineInstruction +
    p.hoursBreakdown.handsOnLab +
    p.hoursBreakdown.examPrep +
    p.hoursBreakdown.careerPlacement
  );
}
