/**
 * Commercial Cleaning Certification Program — ported from fix2.
 *
 * Source: elevateforhumanity/fix2 (archived 2026-11-23, read-only)
 *   lms-data/courses/program-commercial-cleaning.ts @ HEAD d155c9d
 *   id 'commercial-cleaning-001', slug 'commercial-cleaning', 80h, HYBRID,
 *   funding listed in source: WRG / WIOA_ADULT / WIOA_DW / WEX / SELF_PAY.
 *
 * What is preserved verbatim from the source: slug, title, description,
 * 80 total hours, hybrid delivery, multiple locations, the 5 outcomes,
 * the 3 modules with all 10 lesson titles/durations, the target audience,
 * the external credential name, and the enrolment path
 * (/student/enroll/commercial-cleaning -> lmsCourseSlug below).
 *
 * What fix2 does NOT state and this file therefore does NOT invent:
 * no calendar length (durationWeeks 0 = competency-based, the established
 * pattern in lib/program-constants.ts), no price, no salary figures
 * (career-pathway salaryRange is 'Varies by employer'), no labour-market
 * source. Funding: the source's WRG/WIOA/WEX listing is recorded in
 * fundingNotes, but the slug is NOT in lib/programs/funding-registry, so
 * normalizePublicProgram() will present it as self-pay until the funding
 * is verified and registered — do not publish a funding claim from this
 * file alone.
 *
 * Fields marked DERIVED below are structural filler required by
 * ProgramSchema (3-6 credentials, >=2 pathway steps, >=1 employer
 * partner, >=1 compliance item). Confirm each with admissions before
 * merge; they are not source facts.
 */
import type { ProgramSchema } from '@/lib/programs/program-schema';

export const COMMERCIAL_CLEANING: ProgramSchema = {
  slug: 'commercial-cleaning',
  title: 'Commercial Cleaning Certification Program',
  subtitle:
    'Comprehensive training program for Commercial Cleaning.',
  sector: 'skilled-trades',
  category: 'Commercial Cleaning',
  programType: 'certification',
  // TODO: verify this asset exists; swap for a real cleaning image before merge.
  heroImage: '/images/pexels/commercial-cleaning.webp',
  heroImageAlt: 'Commercial cleaning training',
  deliveryMode: 'hybrid',
  deliveredBy: 'Elevate',
  durationWeeks: 0,
  hoursPerWeekMin: 0,
  hoursPerWeekMax: 0,
  hoursBreakdown: {
    modules: [{ label: 'Commercial cleaning instruction, labs and exam preparation', hours: 80 }],
  },
  schedule: 'Hybrid — multiple locations; schedule confirmed at enrollment',
  cohortSize: 'Multiple locations — cohort details confirmed at enrollment',
  fundingStatement:
    'Regular self-pay program. Review the published price and payment options before applying.',
  selfPayCost: 'Contact admissions',
  credentials: [
    {
      name: 'Certified Commercial Cleaning',
      issuer: 'To be confirmed — external credential body',
      description:
        'External credential named in the source course (credential partner: OTHER). Confirm the issuing body with admissions before merge.',
    },
    {
      // DERIVED: program-completion credential in the LMS pattern (cf. SANITATION).
      name: 'Commercial Cleaning Program Completion',
      issuer: 'Elevate for Humanity',
      description: 'Awarded on completion of the 80-hour hybrid program.',
    },
    {
      // DERIVED from source Module 1 lesson 'Safety and Ethics'.
      name: 'Workplace Safety & Ethics',
      issuer: 'Elevate for Humanity',
      description: 'Covers safety and ethics, taught in Module 1 of the source course.',
    },
  ],
  outcomes: [
    { statement: 'Master core competencies' },
    { statement: 'Gain hands-on experience' },
    { statement: 'Prepare for certification' },
    { statement: 'Develop professional skills' },
    { statement: 'Achieve career readiness' },
  ],
  // DERIVED structure: no salary figures are stated in the source.
  careerPathway: [
    {
      title: 'Commercial Cleaner (entry level)',
      timeframe: '0–3 months',
      requirements: 'Commercial Cleaning Certification Program completion',
      salaryRange: 'Varies by employer',
    },
    {
      title: 'Experienced Commercial Cleaner',
      timeframe: '1–3 years',
      requirements: 'Certification + on-the-job experience',
      salaryRange: 'Varies by employer',
    },
    {
      title: 'Cleaning Team Lead / Supervisor',
      timeframe: '3–5 years',
      requirements: 'Experience + demonstrated leadership',
      salaryRange: 'Varies by employer',
    },
  ],
  weeklySchedule: [
    {
      week: 'Module 1',
      title: 'Introduction to Commercial Cleaning',
      competencyMilestone: 'Overview and fundamentals',
    },
    {
      week: 'Module 2',
      title: 'Core Skills',
      competencyMilestone: 'Essential skills and techniques',
    },
    {
      week: 'Module 3',
      title: 'Certification Preparation',
      competencyMilestone: 'Prepare for certification exam',
    },
  ],
  curriculum: [
    {
      title: 'Introduction to Commercial Cleaning',
      topics: ['Industry Overview', 'Core Concepts', 'Safety and Ethics', 'Module Quiz'],
    },
    {
      title: 'Core Skills',
      topics: ['Skill Development', 'Hands-On Practice', 'Advanced Techniques'],
    },
    {
      title: 'Certification Preparation',
      topics: ['Exam Overview', 'Practice Exam', 'Final Review'],
    },
  ],
  complianceAlignment: [
    {
      // DERIVED from source Module 1 lesson 'Safety and Ethics'.
      standard: 'Workplace Safety & Ethics',
      description:
        'Safety and ethics training is included in Module 1 (Industry Overview, Core Concepts, Safety and Ethics).',
    },
  ],
  laborMarket: {
    medianSalary: 0,
    salaryRange: 'Varies by employer',
    growthRate: 'Contact admissions for current local labor-market information',
    source: 'To be confirmed — no labor-market source stated in the fix2 course',
    sourceYear: 2026,
    region: 'National',
  },
  careers: [
    { title: 'Commercial Cleaner', salary: 'Varies by employer' },
    { title: 'Janitorial / Custodial Associate', salary: 'Varies by employer' },
    { title: 'Cleaning Team Lead', salary: 'Varies by employer' },
  ],
  cta: {
    applyHref: '/apply?program=commercial-cleaning',
    requestInfoHref: '/programs/commercial-cleaning/request-info',
    advisorHref: '/contact',
    courseHref: '/programs/commercial-cleaning',
  },
  programDescription: [
    'Comprehensive training program for Commercial Cleaning.',
    'Designed for career seekers, career changers, and recent graduates.',
  ],
  modality: 'Hybrid — in-person hands-on practice with LMS-supported theory',
  facilityInfo: 'Multiple locations',
  // DERIVED placeholder: no employer partners are named in the source.
  employerPartners: ['Contact admissions for current employer partners'],
  pricingIncludes: [
    '80 instructional hours',
    'Certification preparation',
    'Hands-on lab practice',
  ],
  faqs: [
    {
      question: 'How long is the program?',
      answer: '80 hours, delivered hybrid across multiple locations.',
    },
    {
      question: 'Is funding available?',
      answer:
        'The source course listed WRG, WIOA Adult & Dislocated Worker, WEX, and self-pay. Eligibility is determined by WorkOne or the responsible agency; the program is not yet verified in the Elevate-lms funding registry, so confirm current funding status with admissions.',
    },
  ],
  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Commercial Cleaning Certification Program' },
  ],
  metaTitle: 'Commercial Cleaning Certification Program | Elevate for Humanity',
  metaDescription:
    'Comprehensive 80-hour hybrid Commercial Cleaning Certification Program. Multiple locations. Contact admissions for schedule, pricing, and funding.',
  fundingOptions: ['self_pay'],
  funding: {
    fssa_eligible: false,
    wioa_eligible: false,
    wrg_eligible: false,
    fundingNotes:
      'Source course in fix2 listed WRG / WIOA Adult & DW / WEX / self-pay. Not verified in the Elevate-lms funding registry; public display is self-pay until verified.',
  },
  lmsCourseSlug: 'commercial-cleaning',
};
