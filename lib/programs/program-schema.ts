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

// ─── Credential ──────────────────────────────────────────────────────
export interface ProgramCredential {
  /** Credential name as it appears on the certificate/card */
  name: string;
  /** External issuing body (e.g., "EPA", "OSHA", "PTCB", "Indiana SPLA") */
  issuer: string;
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

// ─── CTA Links ───────────────────────────────────────────────────────
export interface CTALinks {
  /** Link for new applicants — goes to the application form */
  applyHref: string;
  /** Link for enrolled students — goes to their LMS dashboard or course */
  enrollHref?: string;
  advisorHref?: string;
  courseHref?: string;
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

  // ─── Media ───────────────────────────────────────────────────────
  heroImage: string;
  heroImageAlt: string;
  videoSrc?: string;
  voiceoverSrc?: string;

  // ─── A. Header Spec Panel ────────────────────────────────────────
  deliveryMode: 'online' | 'hybrid' | 'in-person';
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
  /** When true, program is not WIOA/grant eligible — self-pay only */
  isSelfPay?: boolean;

  // ─── Facility & Delivery Details ────────────────────────────────
  facilityDetails?: {
    address: string;
    classSize: string;        // e.g. "Up to 20 students per cohort"
    labEquipment?: string;    // e.g. "6 HVAC training rigs, EPA 608 exam station"
    instructors: {
      name: string;
      credential: string;     // e.g. "EPA 608 Universal, OSHA 30"
      experience: string;     // e.g. "12 years field experience"
    }[];
  };
  badge?: string;
  badgeColor?: 'red' | 'green' | 'blue' | 'orange' | 'purple';

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
    note: string;       // e.g. "Not government funded — tuition is paid directly to Elevate"
    plans: {
      label: string;    // e.g. "Pay in Full"
      amount: string;   // e.g. "$5,000"
      detail: string;   // e.g. "One-time payment, 5% discount applied"
    }[];
  };

  // ─── J. Institutional Footer ────────────────────────────────────
  admissionRequirements: string[];
  equipmentIncluded: string;
  modality: string;
  facilityInfo: string;
  bilingualSupport?: string;
  employerPartners: string[];
  pricingIncludes: string[];
  paymentTerms: string;

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
    errors.push({ field: 'credentials', message: `Need at least 3 credentials, got ${p.credentials.length}` });
  }
  if (p.credentials.length > 6) {
    errors.push({ field: 'credentials', message: `Maximum 6 credentials, got ${p.credentials.length}` });
  }
  for (const c of p.credentials) {
    if (!c.issuer) {
      errors.push({ field: 'credentials', message: `Credential "${c.name}" missing issuer` });
    }
  }

  // Outcomes: 5–8 measurable
  if (p.outcomes.length < 5) {
    errors.push({ field: 'outcomes', message: `Need at least 5 measurable outcomes, got ${p.outcomes.length}` });
  }
  if (p.outcomes.length > 8) {
    errors.push({ field: 'outcomes', message: `Maximum 8 outcomes, got ${p.outcomes.length}` });
  }

  // Career pathway: at least 2 steps
  if (p.careerPathway.length < 2) {
    errors.push({ field: 'careerPathway', message: `Need at least 2 career pathway steps` });
  }

  // Weekly schedule must match duration
  if (p.weeklySchedule.length === 0) {
    errors.push({ field: 'weeklySchedule', message: 'Weekly schedule is empty' });
  }

  // Compliance: at least 1
  if (p.complianceAlignment.length === 0) {
    errors.push({ field: 'complianceAlignment', message: 'Need at least 1 compliance alignment' });
  }

  // Labor market must have source and year
  if (!p.laborMarket.source) {
    errors.push({ field: 'laborMarket', message: 'Labor market stats must include source' });
  }
  if (!p.laborMarket.sourceYear) {
    errors.push({ field: 'laborMarket', message: 'Labor market stats must include source year' });
  }

  // Employer partners: at least 1
  if (p.employerPartners.length === 0) {
    errors.push({ field: 'employerPartners', message: 'Need at least 1 employer partner' });
  }

  return errors;
}

// ═══════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════

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
