import type { ProgramSchema } from '@/lib/programs/program-schema';

export const ESTHETICIAN_APPRENTICESHIP: ProgramSchema = {
  slug: 'esthetician-apprenticeship',
  title: 'Esthetician Apprenticeship Pathway',
  subtitle:
    'DOL-registered, competency-based Esthetician Apprenticeship under Appendix A: complete 20 verified occupational competencies and 300 hours of related instruction with supervised host-site training and documented progress.',
  sector: 'personal-services',
  category: 'Esthetics',
  programType: 'apprenticeship',
  heroImage: '/images/pexels/esthetician.webp',
  heroImageAlt: 'Esthetician apprentice completing supervised skincare training in Indiana',
  videoSrc: '/videos/esthetician-spa.mp4',
  deliveryMode: 'in-person',
  deliveredBy: 'Partner',
  durationWeeks: 0,
  hoursPerWeekMin: 25,
  hoursPerWeekMax: 25,
  hoursBreakdown: { onlineInstruction: 300, handsOnLab: 0, examPrep: 0, careerPlacement: 0 },
  schedule: 'Competency-based progression through 20 Appendix A competencies, with 300 required related-instruction hours and supervised host-site practice.',
  cohortSize: '1–3 participants per approved host site',
  fundingStatement:
    'Self-pay enrollment is available. Any employer or workforce funding must be confirmed in writing for the individual participant before enrollment.',
  selfPayCost: '$4,980',
  fundingOptions: ['self_pay'],
  badge: 'Indiana Esthetics Pathway',
  badgeColor: 'blue',
  credentials: [
    {
      name: 'Indiana Esthetician License',
      issuer: 'Indiana Professional Licensing Agency (IPLA)',
      description: 'State license awarded by Indiana after the applicant satisfies current education, examination, application, and other licensing requirements.',
      validity: 'Subject to current Indiana renewal requirements',
    },
    {
      name: 'Infection Control Certificate',
      issuer: 'Elevate for Humanity',
      description: 'Training record covering sanitation and infection-control practices for personal services.',
      validity: 'Program record',
    },
    {
      name: 'CPR/AED/First Aid',
      issuer: 'Approved training provider',
      description: 'Emergency-response training when included in the participant’s current enrollment package.',
      validity: 'Per issuing provider',
    },
  ],
  outcomes: [
    {
      statement: 'Perform facials, skin analysis, and hair-removal services under appropriate supervision',
      assessedAt: 'During supervised practice',
    },
    {
      statement: 'Complete all 20 Appendix A occupational competencies and 300 related-instruction hours',
      assessedAt: 'Program completion',
    },
    {
      statement: 'Demonstrate readiness for the current Indiana esthetician licensing process',
      assessedAt: 'After registered-program completion',
    },
    {
      statement: 'Maintain sanitation and infection-control standards during esthetics services',
      assessedAt: 'Ongoing',
    },
    {
      statement: 'Demonstrate professional communication, consultation, documentation, and client-care skills',
      assessedAt: 'Ongoing',
    },
  ],
  careerPathway: [
    {
      title: 'Esthetics Trainee',
      timeframe: 'During required education',
      requirements: 'Active enrollment and supervised practice',
      salaryRange: 'Compensation, if any, depends on the host-site employment arrangement',
    },
    {
      title: 'Licensed Esthetician',
      timeframe: 'After meeting Indiana licensing requirements',
      requirements: 'Indiana esthetician license',
      salaryRange: '$22,000–$65,000+ depending on role, experience, and service model',
    },
    {
      title: 'Lead Esthetician / Spa Manager',
      timeframe: 'With additional experience',
      requirements: 'License plus relevant experience',
      salaryRange: 'Varies by employer, location, and responsibilities',
    },
  ],
  weeklySchedule: [
    {
      week: 'Phase 1',
      title: 'Sanitation & Skin Science',
      competencyMilestone: 'Demonstrate sanitation protocols, client safety, and foundational skin analysis',
    },
    {
      week: 'Phase 2',
      title: 'Facials, Treatments & Hair Removal',
      competencyMilestone: 'Perform supervised esthetics services using documented procedures',
    },
    {
      week: 'Phase 3',
      title: 'Licensing Preparation & Completion',
      competencyMilestone: 'Complete 20 competencies and 300 RTI hours, then prepare for the licensing process',
    },
  ],
  curriculum: [
    {
      title: 'Esthetic Services',
      topics: [
        'Facials and skin treatments',
        'Skin analysis',
        'Hair removal',
        'Product knowledge',
        'Client consultation',
      ],
    },
    {
      title: 'Safety & Compliance',
      topics: ['Infection control', 'Indiana licensing awareness', 'Chemical safety', 'Client documentation'],
    },
    {
      title: 'Professional Practice',
      topics: ['Service planning', 'Client communication', 'Business practices', 'Progress documentation'],
    },
  ],
  complianceAlignment: [
    {
      standard: 'U.S. Department of Labor Appendix A — Esthetician (RAPIDS 2089CB)',
      description:
        'Registered-program completion is competency-based: 20 verified competencies plus 300 related-instruction hours. Licensing requirements are tracked separately and remain subject to current state review.',
    },
  ],
  trainingPhases: [
    {
      phase: 1,
      title: 'Foundations',
      weeks: 'Early program',
      focus: 'Sanitation, skin science, consultation, and safety.',
      labCompetencies: ['Demonstrate sanitation protocols', 'Conduct supervised skin analysis'],
    },
    {
      phase: 2,
      title: 'Core Services',
      weeks: 'Mid program',
      focus: 'Facials, hair removal, treatment procedures, and client care.',
      labCompetencies: ['Perform supervised facial services', 'Execute hair-removal procedures safely'],
    },
    {
      phase: 3,
      title: 'Completion & Licensing Preparation',
      weeks: 'Final program phase',
      focus: 'Appendix A competency completion, RTI verification, documentation, and licensing preparation.',
      labCompetencies: ['Complete 20 documented Appendix A competencies', 'Prepare licensing application materials'],
    },
  ],
  credentialPipeline: [
    {
      training: 'Registered Esthetician Apprenticeship — 20 competencies + 300 RTI hours',
      certification: 'Indiana Esthetician License',
      certBody: 'Indiana Professional Licensing Agency',
      jobRole: 'Licensed Esthetician',
    },
  ],
  laborMarket: {
    medianSalary: 38400,
    salaryRange: '$22,000–$65,000+',
    growthRate: '9% (faster than average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis-Carmel-Anderson MSA',
  },
  careers: [
    { title: 'Licensed Esthetician', salary: 'Varies by employer and service model' },
    { title: 'Medical Spa Esthetician', salary: 'Varies by employer, licensure scope, and experience' },
    { title: 'Spa Manager', salary: 'Varies by employer and management responsibilities' },
  ],
  cta: {
    applyHref: '/programs/esthetician-apprenticeship/apply',
    requestInfoHref: '/contact?program=esthetician-apprenticeship',
    careerConnectHref:
      'https://www.indianacareerconnect.com/jobs/search?q=esthetician&location=Indiana',
    advisorHref: '/contact',
    courseHref: '/programs/esthetician-apprenticeship',
  },
  admissionRequirements: [
    'Meet current Indiana eligibility requirements for the intended licensing pathway',
    'Complete Elevate admissions and identity-verification requirements',
    'Confirm an approved supervised training arrangement before supervised practice begins',
  ],
  equipmentIncluded: 'Program-specific kit and host-site supply details are confirmed before enrollment.',
  modality: 'In-person supervised esthetics education and practice with related instruction',
  facilityInfo: 'Approved partner spa or salon locations are confirmed for each participant before placement.',
  employerPartners: ['Approved Indiana spa and salon host sites when available and authorized'],
  pricingIncludes: [
    '20 verified Appendix A occupational competencies',
    '300 hours of related instruction and progress documentation',
    'Infection-control training',
    'Licensing preparation',
  ],
  paymentTerms:
    'Review the current published self-pay price and checkout terms before enrollment. Third-party installment availability is determined at checkout.',
  faqs: [
    {
      question: 'How is the registered esthetician apprenticeship completed?',
      answer:
        'The approved Appendix A standard is competency-based. Completion requires 20 verified occupational competencies and 300 related-instruction hours. State licensing requirements are tracked separately and should be confirmed before applying for licensure.',
    },
    {
      question: 'Is this occupation federally registered in RAPIDS through Elevate?',
      answer:
        'Yes. The approved Appendix A identifies Esthetician under RAPIDS occupation code 2089CB within registered program 2025-IN-132301.',
    },
  ],
  breadcrumbs: [
    { label: 'Home', href: '/' },
    { label: 'Programs', href: '/programs' },
    { label: 'Esthetician Apprenticeship Pathway' },
  ],
  metaTitle: 'Esthetician Apprenticeship Pathway | Indiana | Elevate for Humanity',
  metaDescription:
    'Registered competency-based esthetician apprenticeship with 20 occupational competencies, 300 related-instruction hours, supervised practice, and licensing preparation.',
  funding: {
    fssa_eligible: false,
    wioa_eligible: false,
    wrg_eligible: false,
    jobReadyIndyEligible: false,
    fundingNotes:
      'No public workforce-funding claim is made for this program. Any third-party funding must be verified and authorized for the individual participant before enrollment.',
  },
};
