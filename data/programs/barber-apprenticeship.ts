import type { ProgramSchema } from '@/lib/programs/program-schema';
import { RAPIDS_CONFIG } from '@/lib/compliance/rapids-config';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { INDIANA_RULES } from '@/lib/licensureRules/IN';
import { BARBER_PRICING } from '@/lib/programs/pricing';

const REGISTERED = getRegisteredProgramStandard('barber-apprenticeship');
if (!REGISTERED) throw new Error('REGISTERED_BARBER_CONTRACT_MISSING');
const STANDARD = REGISTERED.standard;
const RTI_HOURS = REGISTERED.completion.requiredRtiHours;
const COMPETENCY_COUNT = REGISTERED.completion.competencyCount;
const STATE_LICENSURE_HOURS = INDIANA_RULES.required_total_hours;
const TUITION = BARBER_PRICING.fullPrice;
const TUITION_LABEL = `$${TUITION.toLocaleString('en-US')}`;

/**
 * Barber Apprenticeship — canonical public program record.
 *
 * Registered completion is competency-based. STATE_LICENSURE_HOURS is kept in
 * the generic ProgramSchema hours fields only to represent the separate Indiana
 * licensing/training record. It is not the DOL completion denominator.
 */
export const BARBER_APPRENTICESHIP: ProgramSchema = {
  slug: REGISTERED.programSlug,
  title: 'Barber Apprenticeship',
  subtitle: `DOL Registered Apprenticeship in barbering (RAPIDS ${STANDARD.rapidsCode}). Registered completion requires ${COMPETENCY_COUNT} verified competencies plus ${RTI_HOURS} verified hours of Related Technical Instruction. Supervised work records are retained as apprenticeship and state-licensing evidence, not used as a fixed DOL completion counter.`,
  sector: 'personal-services',
  category: 'Personal Services',
  programType: 'apprenticeship',

  heroImage: '/images/pexels/barber-hero.webp',
  heroImageAlt: 'Barber apprentice training at a licensed barbershop',
  videoSrc: '/videos/barber-hero-final.mp4',

  deliveryMode: 'hybrid',
  deliveredBy: 'Partner',
  durationWeeks: 52,
  hoursPerWeekMin: 40,
  hoursPerWeekMax: 40,
  hoursBreakdown: {
    onlineInstruction: RTI_HOURS,
    handsOnLab: STATE_LICENSURE_HOURS,
    examPrep: 0,
    careerPlacement: 0,
  },
  schedule: `Supervised host-shop work is scheduled according to the employment/placement agreement. ${RTI_HOURS} verified RTI hours and all ${COMPETENCY_COUNT} registered competencies are required; state licensing-hour records are tracked separately.`,
  cohortSize: 'Enrollment and host-shop capacity vary by placement availability',
  fundingStatement: `Funding eligibility varies by participant and funding source. Self-pay tuition is ${TUITION_LABEL}; payment plan and eligible BNPL options are available at checkout.`,
  selfPayCost: TUITION_LABEL,
  badge: 'DOL Registered',
  badgeColor: 'blue',

  credentials: [
    {
      name: 'Indiana Barber License',
      issuer: 'Indiana State Board of Cosmetology and Barber Examiners',
      description: 'State licensure is issued only after the applicant satisfies Indiana licensing requirements, including accepted education/apprenticeship documentation and the required examination.',
      validity: 'Subject to Indiana renewal requirements',
    },
    {
      name: 'DOL Registered Apprenticeship Certificate',
      issuer: 'U.S. Department of Labor',
      description: 'Certificate of Completion for successful completion of the registered apprenticeship requirements.',
      validity: 'Completion credential',
    },
    {
      name: 'Barbershop Business Management Certificate',
      issuer: 'Elevate for Humanity',
      description: 'Business fundamentals for barbers including client management, booking, pricing, and shop operations.',
    },
  ],

  outcomes: [
    { statement: 'Perform standard haircut styles under qualified supervision and documented competency review', assessedAt: 'During supervised work' },
    { statement: 'Execute shaving and facial-hair services using required sanitation and safety procedures', assessedAt: 'During supervised work' },
    { statement: 'Recognize common hair/scalp conditions and know when referral is appropriate', assessedAt: 'During RTI/work' },
    { statement: 'Demonstrate required sanitation, disinfection, and workstation procedures', assessedAt: 'Beginning and throughout program' },
    { statement: `Complete all ${COMPETENCY_COUNT} registered Appendix A competencies`, assessedAt: 'Program completion' },
    { statement: `Complete ${RTI_HOURS} verified hours of Related Technical Instruction`, assessedAt: 'Program completion' },
    { statement: 'Maintain required supervised-work, wage, placement, and state-licensing evidence', assessedAt: 'Throughout program' },
    { statement: 'Prepare for the Indiana barber licensing examination', assessedAt: 'End of program' },
  ],

  careerPathway: [
    {
      title: 'Barber Apprentice',
      timeframe: 'During registered apprenticeship',
      requirements: 'Registered apprentice with an approved host-shop placement',
      salaryRange: 'Employer-set under the applicable registered wage schedule and wage law',
    },
    {
      title: 'Licensed Barber',
      timeframe: 'After program and licensing requirements are completed',
      requirements: 'Registered-program completion plus Indiana licensing requirements',
      salaryRange: 'Employer/market dependent',
    },
    {
      title: 'Senior Barber / Specialist',
      timeframe: 'Experience-based',
      requirements: 'Established skills and clientele',
      salaryRange: 'Employer/market dependent',
    },
    {
      title: 'Shop Owner / Manager',
      timeframe: 'Experience-based',
      requirements: 'Applicable business/shop licensing and management requirements',
      salaryRange: 'Business-performance dependent',
    },
  ],

  weeklySchedule: [
    { week: 'Phase 1', title: 'Foundations & Sanitation', competencyMilestone: 'Demonstrate sanitation, tool identification, disinfection, and safe workstation procedures.' },
    { week: 'Phase 2', title: 'Basic Cutting Techniques', competencyMilestone: 'Begin supervised cutting services and documented skill repetitions.' },
    { week: 'Phase 3', title: 'Shaving & Facial Hair', competencyMilestone: 'Demonstrate safe shaving, beard shaping, and client-preparation procedures.' },
    { week: 'Phase 4', title: 'Intermediate Cutting', competencyMilestone: 'Demonstrate fades, tapers, scissor-over-comb, and shape-up techniques under supervision.' },
    { week: 'Phase 5', title: 'Advanced Techniques', competencyMilestone: 'Progress through advanced services and registered competency verification.' },
    { week: 'Phase 6', title: 'Business & Client Management', competencyMilestone: 'Apply booking, pricing, client-service, and business fundamentals.' },
    { week: 'Phase 7', title: 'License Exam Preparation', competencyMilestone: 'Complete exam-preparation activities and required program documentation.' },
    { week: 'Phase 8', title: 'Completion', competencyMilestone: `Verify all ${COMPETENCY_COUNT} registered competencies, ${RTI_HOURS} RTI hours, required work/wage evidence, and completion documentation.` },
  ],

  curriculum: [
    {
      title: 'Barbering Foundations',
      topics: ['Barbering profession and standards', 'Indiana licensing and professional requirements', 'Sanitation, disinfection, and infection control', 'Tool identification and maintenance', 'Client consultation and communication'],
    },
    {
      title: 'Hair Cutting Techniques',
      topics: ['Clipper techniques', 'Scissor-over-comb and shear work', 'Shape-ups and edge work', 'Specialty cuts', 'Hair texturizing and layering'],
    },
    {
      title: 'Shaving & Facial Hair',
      topics: ['Straight razor safety', 'Beard shaping and design', 'Hot towel procedures', 'Facial skin care', 'Mustache trimming and styling'],
    },
    {
      title: 'Scalp & Hair Science',
      topics: ['Hair and scalp anatomy', 'Common scalp conditions', 'Product selection', 'Chemical-service safety', 'Contraindications and referral'],
    },
    {
      title: 'Business Management',
      topics: ['Shop operations', 'Client booking and scheduling', 'Pricing fundamentals', 'Marketing fundamentals', 'Income and expense tracking'],
    },
    {
      title: 'License Exam Prep & Career Launch',
      topics: ['Indiana examination review', 'Practical-skill review', 'Portfolio documentation', 'Career preparation', 'Entrepreneurship fundamentals'],
    },
  ],

  complianceAlignment: [
    { standard: 'DOL Registered Apprenticeship', description: `RAPIDS ${STANDARD.rapidsCode} is competency-based: ${COMPETENCY_COUNT} verified competencies plus ${RTI_HOURS} verified RTI hours. Supervised work hours are maintained as evidence and are not a fixed DOL completion denominator.` },
    { standard: 'RAPIDS Program Registration', description: `Sponsor of Record: ${RAPIDS_CONFIG.sponsorOfRecord}; registration ID ${RAPIDS_CONFIG.registrationId}.` },
    { standard: 'Indiana Professional Licensing Agency', description: `Indiana licensing/training evidence is tracked separately from the registered completion basis. The current generic state-tracking value in this program record is ${STATE_LICENSURE_HOURS.toLocaleString()} hours and must not be represented as the DOL completion requirement.` },
    { standard: 'Indiana State Board of Cosmetology and Barber Examiners', description: 'Licensure remains subject to current state application, examination, documentation, and other requirements.' },
  ],

  trainingPhases: [
    {
      phase: 1,
      title: 'Foundations & Sanitation',
      weeks: 'Early program',
      focus: 'Professional requirements, sanitation/infection control, hair/scalp fundamentals, and tool proficiency.',
      labCompetencies: [
        'Sanitize and disinfect tools and work surfaces correctly',
        'Identify conditions that require referral',
        'Demonstrate proper draping and client preparation',
        'Maintain a clean and organized workstation',
      ],
    },
    {
      phase: 2,
      title: 'Cutting & Styling Techniques',
      weeks: 'Progressive supervised work',
      focus: 'Clipper cuts, scissor cuts, fades, tapers, beard shaping, and styling.',
      labCompetencies: [
        'Perform fades and blending under supervision',
        'Execute scissor-over-comb techniques',
        'Shape and line facial hair safely',
        'Complete services within expected shop workflow',
        'Demonstrate safe shaving procedures',
      ],
    },
    {
      phase: 3,
      title: 'Advanced Skills & Business',
      weeks: 'Progressive work/RTI',
      focus: 'Advanced services, client management, and business fundamentals.',
      labCompetencies: [
        'Perform advanced services within authorized scope',
        'Apply consultation and service-planning skills',
        'Maintain client/service documentation',
        'Apply basic pricing and business concepts',
      ],
    },
    {
      phase: 4,
      title: 'Completion & Exam Preparation',
      weeks: 'Final program phase',
      focus: 'Completion of registered competencies, verified RTI, required evidence, documentation, and licensing preparation.',
      labCompetencies: [
        `Complete all ${COMPETENCY_COUNT} registered competency verifications`,
        `Complete ${RTI_HOURS} verified RTI hours`,
        'Maintain required supervised-work and wage evidence',
        'Complete licensing-exam preparation',
      ],
    },
  ],

  credentialPipeline: [
    {
      training: 'Registered barber apprenticeship',
      certification: 'DOL Registered Apprenticeship Certificate of Completion',
      certBody: 'U.S. Department of Labor',
      jobRole: 'Barber apprentice / program completer',
    },
    {
      training: 'Indiana barber licensing preparation',
      certification: 'Indiana Barber License',
      certBody: 'Indiana Professional Licensing Agency',
      jobRole: 'Licensed Barber',
    },
    {
      training: 'Business fundamentals',
      certification: 'Barbershop Business Management Certificate',
      certBody: 'Elevate for Humanity',
      jobRole: 'Barber / future shop manager or owner',
    },
  ],

  laborMarket: {
    medianSalary: 38000,
    salaryRange: 'Varies by employer, location, tips, clientele, and business model',
    growthRate: 'See current BLS Occupational Outlook Handbook',
    source: 'U.S. Bureau of Labor Statistics, Occupational Outlook Handbook',
    sourceYear: 2024,
    region: 'Indiana',
  },
  careers: [
    { title: 'Licensed Barber', salary: 'Market dependent' },
    { title: 'Senior Barber / Stylist', salary: 'Market dependent' },
    { title: 'Barbershop Manager', salary: 'Market dependent' },
    { title: 'Shop Owner', salary: 'Business-performance dependent' },
  ],

  cta: {
    applyHref: '/programs/barber-apprenticeship/apply',
    requestInfoHref: '/programs/barber-apprenticeship/request-info',
    careerConnectHref: 'https://www.indianacareerconnect.com/jobs/search?q=barber&location=Indiana',
    advisorHref: '/contact',
  },

  admissionRequirements: [
    'Meet the minimum age and other eligibility requirements applicable to the registered program and employment placement',
    'Complete Elevate admissions and apprenticeship onboarding',
    'Be assigned to or approved with a participating host shop before supervised work begins',
    'Provide required identity, employment, and program documentation',
  ],
  equipmentIncluded: 'Program-provided items are governed by the current enrollment agreement and program cost disclosure.',
  modality: 'Hybrid — Related Technical Instruction through the LMS and supervised work at an approved host shop',
  facilityInfo: 'Approved participating host shops',
  bilingualSupport: 'Support availability may vary; contact admissions for current language-support options.',
  employerPartners: ['Approved participating host shops'],
  pricingIncludes: [
    `${RTI_HOURS} hours of required Related Technical Instruction`,
    `Tracking and verification of all ${COMPETENCY_COUNT} registered competencies`,
    'LMS access for assigned RTI coursework',
    'Supervised-work, wage, placement, and compliance tracking',
    'Licensing-exam preparation support',
  ],
  paymentTerms: `${TUITION_LABEL}. Payment plan and eligible BNPL options are available for self-pay applicants.`,

  deliveryModel: 'internal',
  deliveryModelDetail: 'hybrid',
  partnerProvider: 'Elevate for Humanity',
  fundingOptions: ['impact', 'employer_paid', 'self_pay'],
  funding: {
    fssa_eligible: true,
    snap_et_eligible: true,
    wioa_eligible: false,
    etpl_approved: false,
    wrg_eligible: false,
  },
  enrollmentType: 'internal',
  partnerCourses: [
    {
      courseId: 'prestige-elevation-barber-curriculum',
      label: 'Prestige Elevation Barber Curriculum',
      partnerName: 'Elevate for Humanity',
      credentialIssued: `RTI completion (${RTI_HOURS} verified hours)`,
      duration: `${RTI_HOURS} hours RTI`,
      required: true,
      enrollmentUrl: 'https://app.elevateforhumanity.org/lms/courses/3fb5ce19-1cde-434c-a8c6-f138d7d7aa17',
    },
  ],
  microCourses: [
    {
      courseId: 'careersafe-osha10-general',
      label: 'OSHA 10-Hour General Industry',
      partnerName: 'CareerSafe',
      credentialIssued: 'OSHA 10-Hour Card',
      duration: '10 hours',
      required: true,
      enrollmentUrl: 'https://www.careersafeonline.com/osha-10-hour-general-industry',
    },
  ],

  faqs: [
    { question: 'How much does the program cost?', answer: `Current self-pay tuition is ${TUITION_LABEL}. Payment plan and eligible BNPL options are available. Public funding eligibility is determined separately.` },
    { question: 'How long is the program?', answer: `This is a competency-based registered occupation. Completion requires all ${COMPETENCY_COUNT} competencies plus ${RTI_HOURS} verified RTI hours and the required placement, supervision, wage, work-evidence, and sponsor records. Calendar duration depends on competency progression, RTI completion, work schedule, transfer decisions, and applicable state licensing requirements.` },
    { question: 'Do I need my own barbershop?', answer: 'No. Applicants without a host shop can request placement assistance. Supervised work can begin only at an approved participating host shop.' },
    { question: 'What credential do I earn?', answer: 'Successful registered-program completers receive the Registered Apprenticeship completion credential. Indiana barber licensure is a separate state process and requires satisfaction of current licensing and examination requirements.' },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Personal Services', href: '/programs/personal-services' },
    { label: 'Barber Apprenticeship' },
  ],

  metaTitle: 'Barber Registered Apprenticeship | Indianapolis | Elevate for Humanity',
  metaDescription: `DOL Registered Barber Apprenticeship (RAPIDS ${STANDARD.rapidsCode}): ${COMPETENCY_COUNT} verified competencies plus ${RTI_HOURS} verified RTI hours, with approved host-shop placement, supervised-work evidence, wage compliance, LMS instruction, and progress tracking.`,
};
