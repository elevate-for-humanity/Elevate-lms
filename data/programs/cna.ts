import type { ProgramSchema } from '@/lib/programs/program-schema';

/**
 * Certified Nursing Assistant (CNA) — Program Detail Template v1
 * Hours math: 6 weeks × 25–30 hrs/week = 150–180 hours
 * Indiana requires 105 hours minimum (75 classroom + 30 clinical)
 */
export const CNA: ProgramSchema = {
  slug: 'cna',
  title: 'Certified Nursing Assistant (CNA)',
  subtitle: 'Prepare for the Indiana CNA state competency exam. Complete 150+ hours of classroom instruction and clinical training in 6 weeks.',
  sector: 'healthcare',
  category: 'Healthcare',

  heroImage: '/images/pages/cna-patient-care.jpg',
  heroImageAlt: 'CNA student practicing patient care in a clinical setting',
  videoSrc: '/videos/cna-hero.mp4',

  deliveryMode: 'hybrid',
  durationWeeks: 6,
  hoursPerWeekMin: 25,
  hoursPerWeekMax: 30,
  hoursBreakdown: {
    onlineInstruction: 60,
    handsOnLab: 80,
    examPrep: 20,
    careerPlacement: 15,
  },
  schedule: 'Mon–Fri, 8:00 AM–2:30 PM (30 hrs/week)',
  eveningSchedule: 'Evening cohorts available for working adults.',
  cohortSize: '10–15 participants per cohort',
  fundingStatement: 'Self-pay program. Flexible payment plans and BNPL options available.',
  selfPayCost: '$2,800',
  isSelfPay: true,
  badge: 'Funding Available',
  badgeColor: 'green',

  credentials: [
    {
      name: 'Indiana Certified Nursing Assistant (CNA)',
      issuer: 'Indiana State Department of Health (ISDH)',
      description: 'State certification required to work as a CNA in Indiana. Earned by passing the written and clinical skills competency exam.',
      validity: '2 years (renewable with 8 hours CE + active employment)',
    },
    {
      name: 'NHA Certified Patient Care Technician (CPCT)',
      issuer: 'National Healthcareer Association (NHA)',
      description: 'National certification covering patient care, phlebotomy basics, and EKG fundamentals. Expands employment options beyond CNA.',
      validity: '2 years',
    },
    {
      name: 'CPR / BLS for Healthcare Providers',
      issuer: 'American Heart Association',
      description: 'Basic Life Support certification required by all healthcare employers. Covers adult, child, and infant CPR plus AED use.',
      validity: '2 years',
    },
    {
      name: 'Bloodborne Pathogens Certificate',
      issuer: 'OSHA / Elevate for Humanity',
      description: 'OSHA-compliant training in bloodborne pathogen exposure prevention, required for clinical settings.',
    },
    {
      name: 'Dementia Care Certificate',
      issuer: 'Elevate for Humanity',
      description: 'Specialized training in dementia and Alzheimer\'s patient care, communication techniques, and behavioral management.',
    },
  ],

  outcomes: [
    { statement: 'Perform 22 CNA clinical skills (bed bath, vital signs, transfers, ROM exercises) per Indiana competency checklist', assessedAt: 'Week 5' },
    { statement: 'Measure and record vital signs (BP within ±4 mmHg, temperature within ±0.2°F, pulse within ±2 bpm)', assessedAt: 'Week 2' },
    { statement: 'Demonstrate proper body mechanics and safe patient transfers using gait belt', assessedAt: 'Week 3' },
    { statement: 'Perform perineal care, catheter care, and ostomy care following infection control protocols', assessedAt: 'Week 4' },
    { statement: 'Document patient observations using medical terminology and standard charting formats', assessedAt: 'Week 3' },
    { statement: 'Pass the Indiana CNA competency exam (written + 5 randomly selected clinical skills)', assessedAt: 'Week 6' },
    { statement: 'Demonstrate fall prevention, restraint alternatives, and emergency response procedures', assessedAt: 'Week 4' },
  ],

  careerPathway: [
    {
      title: 'Certified Nursing Assistant',
      timeframe: '0–6 months after certification',
      requirements: 'Indiana CNA certification (earned in program)',
      salaryRange: '$28,000–$35,000',
    },
    {
      title: 'CNA II / Patient Care Technician',
      timeframe: '6 months – 2 years',
      requirements: 'CNA + CPCT certification + phlebotomy/EKG skills',
      salaryRange: '$32,000–$40,000',
    },
    {
      title: 'LPN (Licensed Practical Nurse)',
      timeframe: '2–3 years',
      requirements: 'LPN program (12 months) + NCLEX-PN exam',
      salaryRange: '$42,000–$55,000',
    },
    {
      title: 'RN (Registered Nurse)',
      timeframe: '3–5 years',
      requirements: 'ADN or BSN program + NCLEX-RN exam',
      salaryRange: '$55,000–$80,000',
    },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'Foundations of Patient Care', competencyMilestone: 'Identify CNA scope of practice, demonstrate hand hygiene and PPE donning/doffing, pass infection control assessment.' },
    { week: 'Week 2', title: 'Vital Signs & Observation', competencyMilestone: 'Measure BP (±4 mmHg), temperature (±0.2°F), pulse (±2 bpm), respirations. Document observations using medical terminology.' },
    { week: 'Week 3', title: 'Body Mechanics & Mobility', competencyMilestone: 'Perform safe transfers (bed to wheelchair, wheelchair to toilet), demonstrate gait belt use, assist with ambulation.' },
    { week: 'Week 4', title: 'Personal Care & Hygiene', competencyMilestone: 'Complete bed bath, perineal care, catheter care, oral care, and dressing assistance per competency checklist.' },
    { week: 'Week 5', title: 'Clinical Practicum', competencyMilestone: 'Complete 30 hours of supervised clinical experience at a long-term care facility. Perform all 22 skills on real patients.' },
    { week: 'Week 6', title: 'Exam Prep & Certification', competencyMilestone: 'Pass practice written exam (80%+), rehearse 5-skill clinical exam, take proctored Indiana CNA competency exam.' },
  ],

  curriculum: [
    {
      title: 'CNA Foundations & Infection Control',
      topics: ['CNA role, scope of practice, and legal responsibilities', 'Patient rights and HIPAA in healthcare settings', 'Hand hygiene: 20-second technique per CDC guidelines', 'PPE donning and doffing sequence', 'Standard precautions and transmission-based precautions', 'Bloodborne pathogens and exposure prevention'],
    },
    {
      title: 'Vital Signs & Patient Observation',
      topics: ['Blood pressure measurement (manual and digital)', 'Temperature measurement (oral, tympanic, axillary)', 'Pulse and respiration counting', 'Height, weight, and intake/output measurement', 'Pain assessment and reporting', 'Medical terminology and charting'],
    },
    {
      title: 'Body Mechanics & Patient Mobility',
      topics: ['Proper body mechanics for healthcare workers', 'Gait belt application and safe transfers', 'Bed positioning: Fowler\'s, supine, lateral, prone', 'Range of motion exercises (passive and active)', 'Fall prevention strategies', 'Wheelchair safety and transport'],
    },
    {
      title: 'Personal Care Skills',
      topics: ['Complete and partial bed baths', 'Perineal care and catheter care', 'Oral care (conscious and unconscious patients)', 'Dressing and grooming assistance', 'Feeding assistance and aspiration prevention', 'Ostomy care and specimen collection'],
    },
    {
      title: 'Specialized Care',
      topics: ['Dementia and Alzheimer\'s care techniques', 'End-of-life care and comfort measures', 'Mental health awareness in long-term care', 'Restorative nursing and rehabilitation support', 'Emergency procedures: choking, falls, seizures', 'Restraint alternatives and safety devices'],
    },
    {
      title: 'Clinical Practicum & Certification',
      topics: ['30 hours supervised clinical at long-term care facility', 'All 22 CNA skills performed on real patients', 'Written exam preparation (75 questions, 90 minutes)', 'Clinical skills exam rehearsal (5 randomly selected skills)', 'Indiana CNA competency exam (proctored)', 'Resume building and healthcare employer introductions'],
    },
  ],

  complianceAlignment: [
    { standard: 'Indiana Administrative Code 410 IAC 16.2', description: 'Training meets Indiana requirements for CNA certification: minimum 105 hours (75 classroom + 30 clinical).' },
    { standard: 'OBRA 1987 (Federal)', description: 'Program complies with Omnibus Budget Reconciliation Act requirements for nurse aide training.' },
    { standard: 'Indiana State Department of Health', description: 'Curriculum approved by ISDH for CNA competency exam eligibility.' },
    { standard: 'Indiana State Board of Nursing', description: 'CNA training program approved by the Indiana State Board of Nursing. Graduates are eligible to sit for the Indiana CNA competency exam.' },
    { standard: 'ETPL Listed', description: 'Eligible Training Provider List — approved for Individual Training Accounts through local workforce boards.' },
  ],

  trainingPhases: [
    {
      phase: 1,
      title: 'Foundations of Patient Care',
      weeks: 'Weeks 1–2',
      focus: 'Medical terminology, infection control, vital signs, and patient rights.',
      labCompetencies: [
        'Measure blood pressure within ±4 mmHg of instructor reading',
        'Measure oral temperature within ±0.2°F',
        'Perform hand hygiene per CDC guidelines (20-second protocol)',
        'Don and doff PPE in correct sequence',
      ],
    },
    {
      phase: 2,
      title: 'Clinical Skills',
      weeks: 'Weeks 3–4',
      focus: 'Activities of daily living, patient transfers, range of motion, and nutrition.',
      labCompetencies: [
        'Perform a two-person transfer from bed to wheelchair',
        'Assist with ambulation using a gait belt',
        'Perform passive range of motion exercises on upper and lower extremities',
        'Make an occupied bed with proper body mechanics',
        'Measure and record intake and output',
      ],
    },
    {
      phase: 3,
      title: 'Specialty Care & Documentation',
      weeks: 'Week 5',
      focus: 'Dementia care, end-of-life care, mental health, and clinical documentation.',
      labCompetencies: [
        'Document vital signs and observations using facility charting system',
        'Demonstrate redirection techniques for patients with dementia',
        'Perform post-mortem care procedures',
      ],
    },
    {
      phase: 4,
      title: 'Clinical Practicum & Exam Prep',
      weeks: 'Week 6',
      focus: '30-hour supervised clinical rotation at a long-term care facility plus state exam preparation.',
      labCompetencies: [
        'Complete 30 hours of supervised patient care at a clinical site',
        'Perform 5 randomly selected CNA skills for state competency evaluation',
        'Pass written practice exam with 75%+ score',
      ],
    },
  ],

  credentialPipeline: [
    {
      training: 'CNA classroom + clinical (6 weeks)',
      certification: 'Indiana CNA Certification',
      certBody: 'Indiana State Department of Health',
      jobRole: 'Certified Nursing Assistant',
    },
    {
      training: 'CPR/AED/First Aid (Week 1)',
      certification: 'CPR/AED/First Aid Certification',
      certBody: 'American Heart Association',
      jobRole: 'Healthcare Worker (all settings)',
    },
    {
      training: 'Dementia care module (Week 5)',
      certification: 'Dementia Care Certificate',
      certBody: 'Elevate for Humanity',
      jobRole: 'Memory Care Aide / Dementia Unit CNA',
    },
  ],

  laborMarket: {
    medianSalary: 35760,
    salaryRange: '$28,000–$45,000',
    growthRate: '+4% (average)',
    source: 'U.S. Bureau of Labor Statistics, Occupational Outlook Handbook',
    sourceYear: 2024,
    region: 'Indiana',
  },
  careers: [
    { title: 'CNA (Long-term Care)', salary: '$28,000–$35,000' },
    { title: 'CNA (Hospital)', salary: '$32,000–$40,000' },
    { title: 'Home Health Aide', salary: '$27,000–$33,000' },
    { title: 'Patient Care Technician', salary: '$32,000–$42,000' },
    { title: 'Medical Assistant', salary: '$34,000–$42,000' },
  ],

  cta: {
    applyHref: '/apply?program=cna',
    advisorHref: '/contact',
  },

  admissionRequirements: [
    '16 years or older (18 for most employers)',
    'High school diploma or GED (or actively pursuing)',
    'Background check and drug screening (required for clinical placement)',
    'TB test or chest X-ray (required for clinical sites)',
    'No prior healthcare experience required',
  ],
  equipmentIncluded: 'Scrubs, blood pressure cuff, stethoscope, gait belt, training materials, and state exam fees included',
  modality: 'Hybrid — Online instruction via LMS, hands-on skills lab at training facility, clinical practicum at long-term care facility',
  facilityInfo: 'Elevate training center + clinical partner facilities, Indianapolis',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available.',
  employerPartners: [
    'Long-term care facilities in Indianapolis (clinical sites)',
    'Home health agencies (placement partners)',
    'Hospital systems (hiring partners)',
  ],
  pricingIncludes: [
    '175 instructional hours (6 weeks)',
    'Indiana CNA competency exam fee',
    'CPR/BLS for Healthcare Providers certification',
    'Scrubs, stethoscope, and blood pressure cuff',
    'All training materials and supplies',
    'LMS access for full program duration',
    'Clinical placement coordination',
    'Career placement support',
  ],
  paymentTerms: 'Self-pay program. $2,800 total tuition. Pay in full, split into installments, or use our income-share option. Pricing is Indiana-based — tuition rates vary by state.',

  faqs: [
    { question: 'Do I need healthcare experience?', answer: 'No. This program starts from the basics and prepares you for the Indiana CNA competency exam in 6 weeks.' },
    { question: 'What is the CNA exam?', answer: 'The Indiana CNA competency exam has two parts: a 75-question written test (90 minutes) and a clinical skills test where you perform 5 randomly selected skills in front of an evaluator.' },
    { question: 'Is this program covered by WIOA or state grants?', answer: 'No. The CNA program at Elevate is self-pay. It is not currently listed on the Indiana ETPL or covered by WIOA, Next Level Jobs, or Workforce Ready Grant. Tuition is $2,800 with flexible payment plans available.' },
    { question: 'Can I become an RN after this?', answer: 'Yes. CNA is the first step on the nursing career ladder. Many CNAs go on to earn LPN (1 year) or RN (2–4 years) credentials. CNA experience strengthens nursing school applications.' },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Healthcare', href: '/programs/healthcare' },
    { label: 'CNA' },
  ],

  metaTitle: 'CNA Training | Indiana Certified Nursing Assistant | Indianapolis',
  metaDescription: '6-week CNA program in Indianapolis, Indiana. State certification, CPR/BLS, and 5 credentials. 150–180 hours. Self-pay $2,800 with flexible payment plans.',
};
