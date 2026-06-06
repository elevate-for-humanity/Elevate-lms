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

import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { sanitizePlatformValue } from '@/lib/config/sanitize-platform-value';

// ─── Credential ──────────────────────────────────────────────────────
export interface ProgramCredential {
  /** Credential name as it appears on the certificate/card */
  name: string;
  /** External issuing body (e.g., "EPA", "OSHA", "PTCB", "Indiana SPLA") */
  issuer: string;
  /** Display name for the issuing body — falls back to issuer when omitted */
  issuingBody?: string;
  /** What holding this credential enables */
  description: string;
  /** How long the credential is valid (e.g., "Lifetime", "2 years", "3 years") */
  validity?: string;
}

// ─── Measurable Outcome ──────────────────────────────────────────────
export interface ProgramOutcome {
  /** Measurable competency statement (e.g., "Calculate superheat within ±2°F") */
  statement: string;
  /** Which week/module this is assessed */
  assessedAt?: string;
}

// ─── Career Pathway Step ─────────────────────────────────────────────
export interface CareerPathwayStep {
  title: string;
  timeframe: string;
  requirements: string;
  salaryRange: string;
}

// ─── Weekly Schedule Entry ───────────────────────────────────────────
export interface WeeklyScheduleEntry {
  week: string;
  title: string;
  competencyMilestone: string;
}

// ─── Curriculum Module ───────────────────────────────────────────────
export interface CurriculumModule {
  title: string;
  topics: string[];
}

// ─── Labor Market Stats ──────────────────────────────────────────────
export interface LaborMarketStats {
  medianSalary: number;
  salaryRange: string;
  growthRate: string;
  source: string;
  sourceYear: number;
  region: string;
}

// ─── Compliance Alignment ────────────────────────────────────────────
export interface ComplianceAlignment {
  standard: string;
  description: string;
}

// ─── Career Outcome ──────────────────────────────────────────────────
export interface CareerOutcome {
  title: string;
  salary: string;
}

// ─── Hours Breakdown ─────────────────────────────────────────────────
export interface HoursBreakdown {
  onlineInstruction: number;
  handsOnLab: number;
  examPrep: number;
  careerPlacement: number;
}

// ─── Training Phase ──────────────────────────────────────────────────
export interface TrainingPhase {
  phase: number;
  title: string;
  weeks: string;
  focus: string;
  /** Hands-on lab competencies verified in this phase */
  labCompetencies: string[];
}

// ─── Credential Pipeline ─────────────────────────────────────────────
export interface CredentialPipeline {
  training: string;
  certification: string;
  certBody: string;
  jobRole: string;
}

// ─── Content Model ───────────────────────────────────────────────────

/**
 * How Elevate delivers this program's training content.
 *   internal  — Elevate owns and delivers the full curriculum via the LMS
 *   partner   — Training is delivered by a third-party partner (HSI, etc.)
 *   hybrid    — Mix of internal LMS content and partner-delivered components
 */
export type ProgramDeliveryModel = 'internal' | 'partner' | 'hybrid';

/**
 * Granular delivery classification used for CTA routing and UI badges.
 *   internal_lms       — Elevate LMS only; learner stays on platform
 *   partner_scorm      — SCORM/LMS content hosted by a partner; learner redirects out
 *   external_redirect  — Enrollment handled entirely by an external provider
 *   hybrid             — Mix of internal LMS + partner/external components
 */
export type DeliveryModel = 'internal_lms' | 'partner_scorm' | 'external_redirect' | 'hybrid';

/**
 * Funding sources that may cover this program.
 * Only include options that are actually available — do not guess.
 */
export type FundingType = 'wioa' | 'wrg' | 'impact' | 'self_pay' | 'employer_paid' | 'unknown';

/**
 * How a learner enrolls.
 *   internal  — Enrollment handled on this platform (apply form → LMS)
 *   external  — Enrollment handled by an external provider (redirect out)
 *   waitlist  — Program not currently open; collect interest only
 */
export type EnrollmentType = 'internal' | 'external' | 'waitlist';

/** A partner or micro course attached to a wraparound program. */
export interface AttachedCourse {
  /** Matches a partner_lms_courses.id or the static id in link-based-integration.ts */
  courseId: string;
  /** Display label shown on the program page */
  label: string;
  /** Partner name (e.g. "CareerSafe", "Health & Safety Institute") */
  partnerName: string;
  /** Credential issued on completion, if any */
  credentialIssued?: string;
  /** Approximate duration shown to learner */
  duration?: string;
  /** Whether this component is required to complete the program */
  required: boolean;
  /** External enrollment/access URL */
  enrollmentUrl?: string;
}

// ─── CTA Links ───────────────────────────────────────────────────────
export interface CTALinks {
  /** Link for new applicants — goes to the application form */
  applyHref: string;
  /** Link for enrolled students — goes to their LMS dashboard or course */
  enrollHref?: string;
  /** Request Information — program-specific inquiry, pre-fills program context */
  requestInfoHref?: string;
  /** Indiana Career Connect — only include for WIOA/apprenticeship programs */
  careerConnectHref?: string;
  advisorHref?: string;
  courseHref?: string;
  /**
   * Stripe Checkout URL for self-pay enrollment.
   * Set to a Stripe payment link (https://buy.stripe.com/...) or to
   * /api/checkout/program?slug=[slug] to create a session server-side.
   * When set, the self-pay track shows a "Pay & Enroll" button instead of "Apply Now".
   */
  stripeCheckoutHref?: string;
}

// ═══════════════════════════════════════════════════════════════════════
//  PROGRAM SCHEMA — All fields required unless marked optional
// ═══════════════════════════════════════════════════════════════════════
export interface ProgramSchema {
  // ─── Identity ────────────────────────────────────────────────────
  slug: string;
  title: string;
  subtitle: string;
  sector: 'skilled-trades' | 'healthcare' | 'personal-services' | 'technology' | 'business';
  category: string;
  /**
   * Program classification for funding agency mapping and nav taxonomy.
   * - workforce: structured, fundable training (WIOA/WRG/FSSA eligible), weeks–months
   * - apprenticeship: DOL-registered, earn-while-you-learn, 12–24+ months
   * - certification: short-duration credential or add-on (CPR, OSHA, HVAC, etc.)
   */
  programType: 'workforce' | 'apprenticeship' | 'certification';

  // ─── Media ───────────────────────────────────────────────────────
  heroImage: string;
  heroImageAlt: string;
  videoSrc?: string;
  voiceoverSrc?: string;

  // ─── A. Header Spec Panel ────────────────────────────────────────
  deliveryMode: 'online' | 'hybrid' | 'in-person';
  /** Who delivers this program — shown as a disclosure on the program page */
  deliveredBy?: 'Elevate' | 'Partner' | 'Elevate or Partner';
  durationWeeks: number;
  hoursPerWeekMin: number;
  hoursPerWeekMax: number;
  /** Computed: durationWeeks × hoursPerWeekMin to durationWeeks × hoursPerWeekMax */
  hoursBreakdown: HoursBreakdown;
  schedule: string;
  eveningSchedule?: string;
  cohortSize: string;
  fundingStatement: string;
  selfPayCost: string;
  /** Upfront deposit amount for BNPL enrollment (e.g., "$600"). Defaults to $600 for apprenticeship programs when omitted. */
  depositAmount?: string;
  /** When true, program is not WIOA/grant eligible — self-pay only */
  isSelfPay?: boolean;

  // ─── Facility & Delivery Details ────────────────────────────────
  facilityDetails?: {
    address: string;
    classSize: string; // e.g. "Up to 20 students per cohort"
    labEquipment?: string; // e.g. "6 HVAC training rigs, EPA 608 exam station"
    instructors: {
      name: string;
      credential: string; // e.g. "EPA 608 Universal, OSHA 30"
      experience: string; // e.g. "12 years field experience"
    }[];
  };
  badge?: string;
  badgeColor?: 'red' | 'green' | 'blue' | 'orange' | 'purple';

  // ─── Enrollment Tracks ───────────────────────────────────────────
  /** Two-track enrollment: funded (Indiana) vs self-pay (national) */
  enrollmentTracks?: {
    funded: {
      label: string; // e.g. "Indiana Residents — Workforce Funded"
      requirement: string; // e.g. "Must reside in Indiana"
      description: string;
      applyHref: string;
      available: true;
    };
    selfPay: {
      label: string; // e.g. "All States — Self-Pay"
      cost: string; // e.g. "$5,000"
      description: string;
      applyHref: string;
      available: boolean; // false = not yet available for enrollment
      comingSoonMessage?: string;
    };
  };

  // ─── B. Credentials Earned (3–6) ────────────────────────────────
  credentials: ProgramCredential[];

  // ─── C. Program Outcomes (5–8 measurable) ───────────────────────
  outcomes: ProgramOutcome[];

  // ─── D. Career Pathway ──────────────────────────────────────────
  careerPathway: CareerPathwayStep[];

  // ─── E. Weekly Schedule ─────────────────────────────────────────
  weeklySchedule: WeeklyScheduleEntry[];

  // ─── F. Course Modules ──────────────────────────────────────────
  curriculum: CurriculumModule[];

  // ─── G. Standards & Compliance ──────────────────────────────────
  complianceAlignment: ComplianceAlignment[];

  // ─── Training Phases (in-program pathway) ─────────────────────
  trainingPhases?: TrainingPhase[];

  // ─── Credential Pipeline (training → cert → job) ──────────────
  credentialPipeline?: CredentialPipeline[];

  // ─── H. Labor Market Info ───────────────────────────────────────
  laborMarket: LaborMarketStats;
  careers: CareerOutcome[];

  // ─── I. CTA ─────────────────────────────────────────────────────
  cta: CTALinks;

  // ─── Program Description (2–4 paragraphs) ───────────────────────
  programDescription?: string[];

  // ─── BNPL / Payment Options ─────────────────────────────────────
  bnplOptions?: {
    headline: string;
    note: string; // e.g. "Not government funded — tuition is paid directly to Elevate"
    plans: {
      label: string; // e.g. "Pay in Full"
      amount: string; // e.g. "$5,000"
      detail: string; // e.g. "One-time payment"
    }[];
  };

  // ─── J. Institutional Footer ────────────────────────────────────
  admissionRequirements?: string[];
  equipmentIncluded?: string;
  modality?: string;
  facilityInfo?: string;
  bilingualSupport?: string;
  employerPartners?: string[];
  pricingIncludes?: string[];
  paymentTerms?: string;

  // ─── Content Model ──────────────────────────────────────────────
  /**
   * How training is delivered for this program.
   * Defaults to 'internal' if omitted (backward-compatible).
   */
  deliveryModel?: ProgramDeliveryModel;

  /**
   * Granular delivery classification — drives CTA routing and UI badges.
   * If omitted, derived from deliveryModel at render time.
   */
  deliveryModelDetail?: DeliveryModel;

  /**
   * Primary partner provider for partner/hybrid programs.
   * Only set when verified — do not guess.
   */
  partnerProvider?: 'hsi' | 'careersafe' | 'elevate-lms' | 'jri' | 'employindy' | 'nrf' | 'milady' | null;

  /**
   * Funding sources actually available for this program.
   * Only include verified options.
   */
  fundingOptions?: FundingType[];

  // ─── Agency-Grade Funding Eligibility ───────────────────────────
  /**
   * Explicit YES/NO funding eligibility flags for agency reporting.
   * These drive FSSA, SNAP E&T, WIOA, and ETPL compliance displays.
   * Derived from fundingOptions when not explicitly set, but prefer
   * explicit values for programs submitted to state agencies.
   */
  funding?: {
    /** FSSA IMPACT — Indiana Family and Social Services Administration */
    fssa_eligible: boolean;
    /** SNAP Employment & Training — FSSA SNAP E&T TPP */
    snap_et_eligible?: boolean;
    /** WIOA Title I — Workforce Innovation and Opportunity Act */
    wioa_eligible: boolean;
    /** Indiana ETPL — Eligible Training Provider List (WorkOne/DWD) */
    etpl_approved?: boolean;
    /** Workforce Ready Grant — Indiana state tuition grant */
    wrg_eligible: boolean;
    /** Job Ready Indy — Indianapolis city workforce fund */
    jobReadyIndyEligible?: boolean;
    /** Free-text notes for advisors and agency staff */
    fundingNotes?: string;
  };

  // ─── Visibility & Status Control ────────────────────────────────
  /**
   * When false, program is hidden from all public surfaces (nav, catalog, cards).
   * Use this instead of deleting programs — preserves enrollment history.
   */
  active?: boolean;
  /**
   * When false, program exists in the registry but is not shown publicly.
   * Allows internal use (reporting, enrollment) without public exposure.
   */
  public_visible?: boolean;

  /**
   * How a learner enrolls. Drives primary CTA behavior.
   *   internal  — apply form → LMS (default for internal/hybrid)
   *   external  — redirect to externalUrl (default for partner)
   *   waitlist  — collect interest only
   */
  enrollmentType?: EnrollmentType;

  /**
   * External enrollment URL for partner/external programs.
   * Required when enrollmentType is 'external'.
   */
  externalEnrollmentUrl?: string;

  /**
   * Slug of the internal LMS course (courses.slug) for programs where
   * Elevate delivers curriculum directly. Only set when deliveryModel
   * is 'internal' or 'hybrid'.
   */
  lmsCourseSlug?: string;

  /**
   * Partner-delivered courses attached to this wraparound program.
   * Rendered in the "What's Included" section of the program page.
   */
  partnerCourses?: AttachedCourse[];

  /**
   * Short supplemental certifications or micro-courses attached to
   * this program (OSHA 10, CPR, Bloodborne Pathogens, etc.).
   */
  microCourses?: AttachedCourse[];

  // ─── Class B Track (CDL and multi-track programs) ───────────────
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

  // ─── Locations ──────────────────────────────────────────────────
  locations?: {
    city: string;
    state: string;
    status: 'active' | 'coming_soon';
    note?: string;
  }[];

  // ─── Job Placement ──────────────────────────────────────────────
  jobPlacement?: {
    headline: string;
    description: string;
    features: string[];
  };

  // ─── FAQ ────────────────────────────────────────────────────────
  faqs: { question: string; answer: string }[];

  // ─── Navigation ─────────────────────────────────────────────────
  breadcrumbs: { label: string; href?: string }[];

  // ─── SEO ────────────────────────────────────────────────────────
  metaTitle: string;
  metaDescription: string;
}

// ═══════════════════════════════════════════════════════════════════════
//  VALIDATION — Rejects programs that don't meet institutional standards
// ═══════════════════════════════════════════════════════════════════════

export interface ValidationError {
  field: string;
  message: string;
}

export function validateProgram(p: ProgramSchema): ValidationError[] {
  const errors: ValidationError[] = [];

  // Hours math: total must equal weeks × hours/week range
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

  // Credentials: 3–6 with issuer
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

  // Outcomes: 5–8 measurable
  if (p.outcomes.length < 5) {
    errors.push({
      field: 'outcomes',
      message: `Need at least 5 measurable outcomes, got ${p.outcomes.length}`,
    });
  }
  if (p.outcomes.length > 8) {
    errors.push({ field: 'outcomes', message: `Maximum 8 outcomes, got ${p.outcomes.length}` });
  }

  // Career pathway: at least 2 steps
  if (!p.careerPathway || p.careerPathway.length < 2) {
    errors.push({ field: 'careerPathway', message: `Need at least 2 career pathway steps` });
  }

  // Weekly schedule must match duration
  if (!p.weeklySchedule || p.weeklySchedule.length === 0) {
    errors.push({ field: 'weeklySchedule', message: 'Weekly schedule is empty' });
  }

  // Compliance: at least 1
  if (!p.complianceAlignment || p.complianceAlignment.length === 0) {
    errors.push({ field: 'complianceAlignment', message: 'Need at least 1 compliance alignment' });
  }

  // Labor market must have source and year
  if (!p.laborMarket?.source) {
    errors.push({ field: 'laborMarket', message: 'Labor market stats must include source' });
  }
  if (!p.laborMarket?.sourceYear) {
    errors.push({ field: 'laborMarket', message: 'Labor market stats must include source year' });
  }

  // Employer partners: at least 1
  if (!p.employerPartners || p.employerPartners.length === 0) {
    errors.push({ field: 'employerPartners', message: 'Need at least 1 employer partner' });
  }

  return errors;
}

// ═══════════════════════════════════════════════════════════════════════
//  CTA ROUTING
// ═══════════════════════════════════════════════════════════════════════

export interface PrimaryCTA {
  label: string;
  href: string;
  external: boolean;
}

/**
 * Derive the single primary CTA for a program page from its enrollmentType.
 *
 * Rules:
 *   internal  → Apply Now → /apply?program=[slug] or cta.applyHref
 *   external  → Continue to Enrollment → externalEnrollmentUrl (opens new tab)
 *   waitlist  → Join Waitlist → /programs/[slug]/request-info
 *   unset     → falls back to cta.applyHref as internal
 *
 * Returns null only when no valid destination can be determined.
 */
export function getPrimaryCTA(p: ProgramSchema): PrimaryCTA | null {
  const type = p.enrollmentType ?? 'internal';

  if (type === 'external') {
    const url = p.externalEnrollmentUrl;
    if (!url) return null; // external without URL — suppress CTA rather than show dead link
    return { label: 'Continue to Enrollment', href: url, external: true };
  }

  if (type === 'waitlist') {
    return {
      label: 'Join Waitlist',
      href: p.cta.requestInfoHref || `/programs/${p.slug}/request-info`,
      external: false,
    };
  }

  // internal (default) — always resolve to program-specific apply page
  const href = p.cta.applyHref || `/apply?program=${p.slug}`;
  return { label: 'Apply Now', href, external: false };
}

// ═══════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════

/** Resolved delivery disclosure — never emit raw template placeholders. */
export function formatDeliveryDisclosure(
  deliveredBy?: ProgramSchema['deliveredBy'],
): string | null {
  if (!deliveredBy) return null;
  const org = sanitizePlatformValue(PLATFORM_DEFAULTS.orgName, 'Elevate for Humanity');
  if (deliveredBy === 'Elevate') return `Delivered directly by ${org}.`;
  if (deliveredBy === 'Partner') return 'Delivered by an approved training partner.';
  return `Delivered by ${org} or an approved training partner.`;
}

/**
 * Derive enrollment tracks for a program.
 * Returns explicit tracks if defined, otherwise builds defaults from fundingOptions.
 * Every program gets a decision-ready tracks object — no silent empty sections.
 */
export function getEnrollmentTracks(
  p: ProgramSchema,
): NonNullable<ProgramSchema['enrollmentTracks']> {
  if (p.enrollmentTracks) return p.enrollmentTracks;

  const hasWIOA = p.fundingOptions?.some((f) => f === 'wioa' || f === 'wrg') ?? false;
  const hasImpact = p.fundingOptions?.includes('impact') ?? false;
  const hasEmployer = p.fundingOptions?.includes('employer_paid') ?? false;
  const applyHref = p.cta.applyHref || `/apply?program=${p.slug}`;

  // Funded track label/description varies by what funding is actually available
  let fundedLabel = 'Workforce-Funded Training';
  let fundedRequirement = 'Must reside in Indiana';
  let fundedDescription =
    'Funding assistance may be available through workforce development programs. Contact an advisor to check your eligibility.';

  if (hasEmployer && !hasWIOA && !hasImpact) {
    fundedLabel = 'Apprenticeship / Employer-Sponsored';
    fundedRequirement = 'Requires employer sponsor agreement';
    fundedDescription =
      'Train while earning wages at a partner employer. Your employer covers tuition through the apprenticeship agreement. No out-of-pocket cost.';
  } else if (hasEmployer && hasImpact && !hasWIOA) {
    fundedLabel = 'FSSA IMPACT or Employer-Sponsored';
    fundedRequirement = 'Indiana residents — SNAP/TANF recipients or employer sponsor';
    fundedDescription =
      'SNAP or TANF recipients may qualify for free training through Indiana\'s FSSA IMPACT program. Alternatively, a licensed employer can sponsor your apprenticeship at no cost to you.';
  } else if (hasWIOA) {
    fundedLabel = hasEmployer ? 'Workforce-Funded or Employer-Sponsored' : 'Workforce-Funded Training';
    fundedRequirement = 'Must reside in Indiana';
    fundedDescription =
      'Federal and Indiana state workforce funding may cover 100% of tuition, books, and exam fees for eligible Indiana residents. We help you apply for every option you qualify for.';
  } else if (hasImpact) {
    fundedLabel = 'FSSA IMPACT (SNAP/TANF)';
    fundedRequirement = 'Indiana residents receiving SNAP or TANF';
    fundedDescription =
      'Indiana\'s SNAP Employment & Training (IMPACT) program can cover 100% of tuition for eligible recipients. You must be referred by your FSSA/DFR case worker — contact them to request a training authorization.';
  }

  return {
    funded: {
      label: fundedLabel,
      requirement: fundedRequirement,
      description: fundedDescription,
      applyHref,
      available: true as const,
    },
    selfPay: {
      label: 'Self-Pay — All States',
      cost: p.selfPayCost,
      description:
        'Enroll immediately without waiting for funding approval. Payment plans, BNPL (Klarna, Afterpay, Zip), and income-share options available.',
      applyHref,
      available: p.enrollmentType !== 'waitlist',
      comingSoonMessage: 'Self-pay enrollment is opening soon. Join the waitlist to be notified.',
    },
  };
}

/** Compute total hours range string from schema */
export function getTotalHoursRange(p: ProgramSchema): string {
  const min = p.durationWeeks * p.hoursPerWeekMin;
  const max = p.durationWeeks * p.hoursPerWeekMax;
  return min === max ? `${min} hours` : `${min}–${max} hours`;
}

/** Compute total hours from breakdown */
export function getTotalHoursFromBreakdown(p: ProgramSchema): number {
  return (
    p.hoursBreakdown.onlineInstruction +
    p.hoursBreakdown.handsOnLab +
    p.hoursBreakdown.examPrep +
    p.hoursBreakdown.careerPlacement
  );
}
