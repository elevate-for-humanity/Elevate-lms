import type { ProgramSchema } from '@/lib/programs/program-schema';

export const CNA: ProgramSchema = {
  slug: 'cna',
  title: 'Certified Nursing Assistant (CNA)',
  subtitle: 'Indiana state CNA certification in 6 weeks. Clinical rotations at licensed healthcare facilities. State exam proctored on-site. WIOA and Workforce Ready Grant funding available for eligible Indiana residents.',
  sector: 'healthcare',
  category: 'Healthcare',

  heroImage: '/images/pages/cna-patient-care.jpg',
  heroImageAlt: 'CNA student assisting a patient at a licensed healthcare facility in Indianapolis',
  videoSrc: '/videos/cna-hero.mp4',

  deliveryMode: 'hybrid',
  durationWeeks: 6,
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
  fundingStatement: 'WIOA and Workforce Ready Grant funding available for eligible Indiana residents. Covers tuition, books, and state exam fees when approved. Eligibility is not guaranteed. Self-pay: $1,800.',
  selfPayCost: '$1,800',
  badge: 'WIOA Eligible',
  badgeColor: 'green',

  credentials: [
    {
      name: 'Indiana State CNA Certification',
      issuer: 'Indiana State Department of Health',
      description: 'State-issued certification required to work as a nursing assistant in Indiana. Listed on the Indiana Nurse Aide Registry.',
      validity: 'Renewable every 2 years with documented work hours',
    },
    {
      name: 'CPR/AED Certification',
      issuer: 'American Red Cross',
      description: 'Required for all healthcare workers. Covers adult, child, and infant CPR plus AED operation.',
      validity: '2 years',
    },
    {
      name: 'Bloodborne Pathogens Certification',
      issuer: 'OSHA',
      description: 'Required training for all healthcare workers who may be exposed to blood or bodily fluids.',
      validity: 'Annual renewal recommended',
    },
  ],

  outcomes: [
    { statement: 'Measure and document vital signs — temperature, pulse, respiration, and blood pressure — within clinical accuracy standards', assessedAt: 'Week 2' },
    { statement: 'Perform a complete bed bath, oral hygiene, and grooming on a skills lab mannequin to state exam standards', assessedAt: 'Week 3' },
    { statement: 'Assist a patient with ambulation using a gait belt, transfer from bed to wheelchair, and reposition in bed', assessedAt: 'Week 4' },
    { statement: 'Complete supervised clinical rotations at a licensed Indiana healthcare facility with documented competency sign-offs', assessedAt: 'Week 5' },
    { statement: 'Pass the Indiana state CNA written and skills exam — proctored on-site at Elevate', assessedAt: 'Week 6' },
    { statement: 'Document patient care observations accurately in a simulated medical record', assessedAt: 'Week 4' },
  ],

  careerPathway: [
    { title: 'Certified Nursing Assistant', timeframe: '0–3 months', requirements: 'Indiana CNA certification', salaryRange: '$16–$20/hr' },
    { title: 'Senior CNA / Lead Aide', timeframe: '1–2 years', requirements: 'CNA + 1 year experience', salaryRange: '$19–$23/hr' },
    { title: 'Medical Assistant', timeframe: '1–2 years', requirements: 'CNA + MA certification', salaryRange: '$18–$25/hr' },
    { title: 'Licensed Practical Nurse (LPN)', timeframe: '2–3 years', requirements: 'CNA + LPN program completion', salaryRange: '$24–$32/hr' },
    { title: 'Registered Nurse (RN)', timeframe: '4–6 years', requirements: 'LPN + RN bridge or BSN', salaryRange: '$35–$50/hr' },
  ],

  weeklySchedule: [
    { week: 'Weeks 1–2', title: 'Foundations of Patient Care', competencyMilestone: 'Accurately measure and document all four vital signs within clinical tolerance' },
    { week: 'Weeks 3–4', title: 'Clinical Skills Lab', competencyMilestone: 'Complete bed bath, transfer, ambulation, and catheter care to state exam standards' },
    { week: 'Weeks 5–6', title: 'Clinical Rotations & State Exam', competencyMilestone: 'Pass Indiana state CNA written and skills exam proctored on-site' },
  ],

  curriculum: [
    {
      title: 'Weeks 1–2: Patient Care Foundations',
      topics: [
        'Measure blood pressure, pulse, temperature, and respiration on lab partners — document results to clinical standard',
        'Perform hand hygiene and don/doff PPE correctly before every patient contact exercise',
        'Explain patient rights and demonstrate how to respond to a patient who refuses care',
        'Apply body mechanics to safely lift, turn, and reposition a patient without injury to self or patient',
      ],
    },
    {
      title: 'Weeks 3–4: Clinical Skills Lab',
      topics: [
        'Complete a full bed bath, shampoo, oral hygiene, and nail care on a skills lab mannequin',
        'Assist a simulated patient with eating, including thickened liquids and adaptive utensils',
        'Perform a two-person transfer from bed to wheelchair using a gait belt — documented competency required',
        'Provide catheter care and record intake/output accurately in a simulated medical record',
        'Perform range-of-motion exercises on all major joints and document patient response',
      ],
    },
    {
      title: 'Weeks 5–6: Clinical Rotations & State Exam',
      topics: [
        'Complete supervised clinical hours at a licensed Indiana nursing facility or hospital',
        'Perform all skills under RN supervision with competency sign-off from clinical instructor',
        'Sit for the Indiana state CNA written exam — 70 questions, 90-minute time limit',
        'Demonstrate 5 randomly selected clinical skills for the state skills examiner — proctored on-site at Elevate',
      ],
    },
  ],

  complianceAlignment: [
    { standard: 'Indiana State Department of Health — CNA Curriculum', description: "Program meets Indiana's minimum 75-hour CNA training requirement including required clinical hours." },
    { standard: 'OBRA 1987 (Omnibus Budget Reconciliation Act)', description: 'Federal law establishing minimum training and competency standards for nursing assistants in Medicare/Medicaid facilities.' },
    { standard: 'WIOA Title I', description: 'Eligible training provider under the Workforce Innovation and Opportunity Act for adult and dislocated worker funding.' },
    { standard: 'Indiana Workforce Ready Grant', description: 'Program approved for WRG funding for eligible Indiana residents pursuing high-demand healthcare careers.' },
  ],

  laborMarket: {
    medianSalary: 35740,
    salaryRange: '$30,000–$42,000',
    growthRate: '4% (as fast as average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis–Carmel–Anderson MSA',
  },

  careerOutcomes: [
    { title: 'Nursing Assistant', salary: '$16–$20/hr' },
    { title: 'Home Health Aide', salary: '$15–$19/hr' },
    { title: 'Patient Care Technician', salary: '$18–$23/hr' },
    { title: 'Medical Assistant (with additional cert)', salary: '$18–$25/hr' },
  ],

  employerPartners: [
    { name: 'Ascension St. Vincent', logoUrl: null, hiringUrl: null },
    { name: 'IU Health', logoUrl: null, hiringUrl: null },
    { name: 'Kindred Healthcare', logoUrl: null, hiringUrl: null },
  ],

  faqs: [
    {
      question: 'Do I need prior healthcare experience?',
      answer: 'No. The program starts from the beginning. You need a high school diploma or GED, a clean background check, and the ability to pass a physical exam.',
    },
    {
      question: 'Is the state exam included?',
      answer: 'Yes. The Indiana state CNA written and skills exam is proctored on-site at Elevate during Week 6. The exam fee is included in tuition or covered by funding when applicable.',
    },
    {
      question: 'What funding is available?',
      answer: 'WIOA and Indiana Workforce Ready Grant funding are available for eligible residents. Many students pay $0. Eligibility is determined by your local WorkOne office. Self-pay tuition is $1,800.',
    },
    {
      question: 'Where are the clinical rotations?',
      answer: 'Clinical rotations are completed at licensed Indiana healthcare facilities partnered with Elevate. Specific sites are assigned based on cohort scheduling and facility availability.',
    },
    {
      question: 'How quickly can I get a job after graduating?',
      answer: 'Most Elevate CNA graduates receive job offers before or immediately after completing the program. Indianapolis-area healthcare employers actively recruit from our cohorts.',
    },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Healthcare', href: '/programs/healthcare' },
    { label: 'Certified Nursing Assistant' },
  ],

  cta: {
    applyHref: '/apply/student?program=cna',
    requestInfoHref: '/contact?program=cna',
  },

  metaTitle: 'CNA Program — Indiana State Certification in 6 Weeks | Elevate for Humanity',
  metaDescription: 'Indiana state CNA certification in 6 weeks. Clinical rotations at licensed facilities. State exam proctored on-site. WIOA and Workforce Ready Grant funding available. Indianapolis.',

  enrollmentType: 'internal',
  deliveryModel: 'internal',
  fundingOptions: ['wioa', 'wrg'],
};
