import type { ProgramSchema } from '@/lib/programs/program-schema';

export const CNA: ProgramSchema = {
  slug: 'cna',
  title: 'Certified Nursing Assistant (CNA)',
  subtitle:
    'Indiana state CNA certification in 6 weeks. Clinical rotations at licensed healthcare facilities. State exam proctored on-site. FSSA Gov Portal funding available for eligible participants. Self-pay: $2,500 (Sale: $1,850).',
  sector: 'healthcare',
  category: 'Healthcare',
  programType: 'workforce',

  heroImage: '/images/pages/cna-patient-care.jpg',
  heroImageAlt: 'CNA student assisting a patient at a licensed healthcare facility in Indianapolis',
  videoSrc: '/videos/cna-hero.mp4',

  deliveryMode: 'hybrid',
  deliveredBy: 'Elevate',
  durationWeeks: 6,
  enrollmentStartLabel: 'Waitlist open — next cohort date confirmed at intake',
  hoursPerWeekMin: 30,
  hoursPerWeekMax: 40,
  hoursBreakdown: {
    onlineInstruction: 60,
    handsOnLab: 90,
    examPrep: 20,
    careerPlacement: 10,
  },
  schedule: 'Mon–Fri, 30–40 hours per week',
  cohortSize: '8–12 participants per cohort',
  fundingStatement:
    'FSSA Gov Portal funding available for eligible participants (SNAP/TANF recipients). Covers tuition, books, and state exam fees when approved. Eligibility is not guaranteed. Self-pay: $2,500 (Sale: $1,850). BNPL available.',
  selfPayCost: '$1,850',
  regularPrice: '$2,500',
  salePrice: '$1,850',
  badge: 'FSSA Eligible',
  badgeColor: 'blue',

  credentials: [
    {
      name: 'Indiana State CNA Certification',
      issuer: 'Indiana State Department of Health',
      description:
        'State-issued certification required to work as a nursing assistant in Indiana. Listed on the Indiana Nurse Aide Registry.',
      validity: 'Renewable every 2 years with documented work hours',
    },
    {
      name: 'CPR/AED Certification',
      issuer: 'American Red Cross',
      description:
        'Required for all healthcare workers. Covers adult, child, and infant CPR plus AED operation.',
      validity: '2 years',
    },
    {
      name: 'Bloodborne Pathogens Certification',
      issuer: 'OSHA',
      description:
        'Required training for all healthcare workers who may be exposed to blood or bodily fluids.',
      validity: 'Annual renewal recommended',
    },
  ],

  outcomes: [
    {
      statement:
        'Measure and document vital signs — temperature, pulse, respiration, and blood pressure — within clinical accuracy standards',
      assessedAt: 'Week 1',
    },
    {
      statement:
        'Perform a complete bed bath, oral hygiene, and grooming on a skills lab mannequin to state exam standards',
      assessedAt: 'Week 2',
    },
    {
      statement:
        'Assist a patient with ambulation using a gait belt, transfer from bed to wheelchair, and reposition in bed',
      assessedAt: 'Week 2',
    },
    {
      statement:
        'Complete supervised clinical rotations at a licensed Indiana healthcare facility with documented competency sign-offs',
      assessedAt: 'Week 3',
    },
    {
      statement:
        'Pass the Indiana state CNA written and skills exam — proctored on-site at Elevate',
      assessedAt: 'Week 6',
    },
    {
      statement: 'Document patient care observations accurately in a simulated medical record',
      assessedAt: 'Week 2',
    },
  ],

  careerPathway: [
    {
      title: 'Certified Nursing Assistant',
      timeframe: '0–3 months',
      requirements: 'Indiana CNA certification',
      salaryRange: '$16–$20/hr',
    },
    {
      title: 'Senior CNA / Lead Aide',
      timeframe: '1–2 years',
      requirements: 'CNA + 1 year experience',
      salaryRange: '$19–$23/hr',
    },
    {
      title: 'Medical Assistant',
      timeframe: '1–2 years',
      requirements: 'CNA + MA certification',
      salaryRange: '$18–$25/hr',
    },
    {
      title: 'Licensed Practical Nurse (LPN)',
      timeframe: '2–3 years',
      requirements: 'CNA + LPN program completion',
      salaryRange: '$24–$32/hr',
    },
    {
      title: 'Registered Nurse (RN)',
      timeframe: '4–6 years',
      requirements: 'LPN + RN bridge or BSN',
      salaryRange: '$35–$50/hr',
    },
  ],

  weeklySchedule: [
    {
      week: 'Week 1',
      title: 'Foundations of Patient Care',
      competencyMilestone:
        'Accurately measure and document all four vital signs within clinical tolerance',
    },
    {
      week: 'Week 2',
      title: 'Clinical Skills Lab',
      competencyMilestone:
        'Complete bed bath, transfer, ambulation, and catheter care to state exam standards',
    },
    {
      week: 'Week 3',
      title: 'Clinical Rotations',
      competencyMilestone:
        'Complete supervised clinical hours at a licensed Indiana facility with competency sign-offs',
    },
    {
      week: 'Weeks 5–6',
      title: 'Exam Prep & State Testing',
      competencyMilestone:
        'Pass Indiana state CNA written and skills exam proctored on-site; career placement briefing',
    },
  ],

  curriculum: [
    {
      title: 'Week 1: Patient Care Foundations',
      topics: [
        'Measure blood pressure, pulse, temperature, and respiration on lab partners — document results to clinical standard',
        'Perform hand hygiene and don/doff PPE correctly before every patient contact exercise',
        'Explain patient rights and demonstrate how to respond to a patient who refuses care',
        'Apply body mechanics to safely lift, turn, and reposition a patient without injury to self or patient',
      ],
    },
    {
      title: 'Week 2: Clinical Skills Lab',
      topics: [
        'Complete a full bed bath, shampoo, oral hygiene, and nail care on a skills lab mannequin',
        'Assist a simulated patient with eating, including thickened liquids and adaptive utensils',
        'Perform a two-person transfer from bed to wheelchair using a gait belt — documented competency required',
        'Provide catheter care and record intake/output accurately in a simulated medical record',
        'Perform range-of-motion exercises on all major joints and document patient response',
      ],
    },
    {
      title: 'Week 3: Clinical Rotations',
      topics: [
        'Complete supervised clinical hours at a licensed Indiana nursing facility or hospital',
        'Perform all skills under RN supervision with competency sign-off from clinical instructor',
      ],
    },
    {
      title: 'Weeks 5–6: State Exam & Placement',
      topics: [
        'Skills review and mock exams aligned to Indiana Nurse Aide Registry standards',
        'Sit for the Indiana state CNA written exam — 70 questions, 90-minute time limit',
        'Demonstrate 5 randomly selected clinical skills for the state skills examiner — proctored on-site at Elevate',
        'Career placement briefing with healthcare employer partners',
      ],
    },
  ],

  complianceAlignment: [
    {
      standard: 'Indiana State Department of Health — CNA Curriculum',
      description:
        "Program meets Indiana's minimum 75-hour CNA training requirement including required clinical hours, delivered in a 6-week accelerated format.",
    },
    {
      standard: 'OBRA 1987 (Omnibus Budget Reconciliation Act)',
      description:
        'Federal law establishing minimum training and competency standards for nursing assistants in Medicare/Medicaid facilities.',
    },
    {
      standard: 'FSSA Gov Portal Program',
      description:
        'Eligible training provider under the Indiana FSSA Gov Portal program for SNAP and TANF recipients pursuing healthcare careers.',
    },
  ],

  laborMarket: {
    medianSalary: 35740,
    salaryRange: '$30,000–$42,000',
    growthRate: '4% (as fast as average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis–Carmel–Anderson MSA',
  },

  careers: [
    { title: 'Nursing Assistant', salary: '$16–$20/hr' },
    { title: 'Home Health Aide', salary: '$15–$19/hr' },
    { title: 'Patient Care Technician', salary: '$18–$23/hr' },
    { title: 'Medical Assistant (with additional cert)', salary: '$18–$25/hr' },
  ],

  employerPartners: [
    'Ascension St. Vincent',
    'IU Health',
    'Kindred Healthcare',
  ],

  faqs: [
    {
      question: 'Do I need prior healthcare experience?',
      answer:
        'No. The program starts from the beginning. You need a high school diploma or GED, a clean background check, and the ability to pass a physical exam.',
    },
    {
      question: 'Is the state exam included?',
      answer:
        'Yes. The Indiana state CNA written and skills exam is proctored on-site at Elevate during Weeks 5–6. The exam fee is included in tuition or covered by funding when applicable.',
    },
    {
      question: 'What funding is available?',
      answer:
        'CNA is funded through the FSSA Gov Portal program for eligible SNAP and TANF recipients. Many students pay $0. Eligibility is determined through FSSA intake. Self-pay tuition is $2,500 (currently on sale for $1,850). BNPL financing available through Affirm, Sezzle, Klarna, and more.',
    },
    {
      question: 'Where are the clinical rotations?',
      answer:
        'Clinical rotations are completed at licensed Indiana healthcare facilities partnered with Elevate. Specific sites are assigned based on cohort scheduling and facility availability.',
    },
    {
      question: 'How quickly can I get a job after graduating?',
      answer:
        'Most Elevate CNA graduates receive job offers before or immediately after completing the program. Indianapolis-area healthcare employers actively recruit from our cohorts.',
    },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Healthcare', href: '/programs/healthcare' },
    { label: 'Certified Nursing Assistant' },
  ],

  cta: {
    applyHref: '/apply?program=cna',
    requestInfoHref: '/contact?program=cna',
  },

  metaTitle: 'CNA Program — Indiana State Certification in 4 Weeks | Elevate for Humanity',
  metaDescription:
    'Indiana state CNA certification in 4 weeks. Clinical rotations at licensed facilities. State exam proctored on-site. FSSA Gov Portal funding available for eligible participants. Self-pay: $2,500 (Sale: $1,850). Indianapolis.',

  enrollmentType: 'internal',
  deliveryModel: 'internal',
  fundingOptions: ['impact', 'self_pay'],


  funding: {
    wioa_eligible: true,
    fssa_eligible: true,
    wrg_eligible: true,
    jobReadyIndyEligible: true,
    fundingNotes: 'Indiana ETPL-listed. FSSA Gov Portal covers eligible SNAP/TANF recipients. WIOA Title I Adult/Dislocated Worker funding available.',
  },
};
