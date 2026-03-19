import type { ProgramSchema } from '@/lib/programs/program-schema';

/**
 * Phlebotomy Technician — Program Detail
 * Indiana does not require state licensure. National certification (NHA CPT) accepted by employers.
 * 4 weeks, 120 hours. Prepares for NHA Certified Phlebotomy Technician (CPT) exam.
 */
export const PHLEBOTOMY: ProgramSchema = {
  slug: 'phlebotomy',
  title: 'Phlebotomy Technician',
  subtitle: 'Complete 120 hours of classroom and clinical training in 4 weeks. Prepare for the NHA Certified Phlebotomy Technician (CPT) exam and enter healthcare within a month.',
  sector: 'healthcare',
  category: 'Healthcare',

  heroImage: '/images/pages/phlebotomy.jpg',
  heroImageAlt: 'Phlebotomy student practicing venipuncture technique',

  deliveryMode: 'hybrid',
  durationWeeks: 4,
  hoursPerWeekMin: 28,
  hoursPerWeekMax: 32,
  hoursBreakdown: {
    onlineInstruction: 40,
    handsOnLab: 60,
    examPrep: 15,
    careerPlacement: 5,
  },
  schedule: 'Mon–Fri, 8:00 AM–2:30 PM',
  eveningSchedule: 'Evening cohorts available.',
  cohortSize: '8–12 participants per cohort',
  fundingStatement: 'Self-pay program. Flexible payment plans and BNPL options available.',
  selfPayCost: '$1,500',
  isSelfPay: true,
  badge: 'Quick Credential',
  badgeColor: 'blue',

  credentials: [
    {
      name: 'NHA Certified Phlebotomy Technician (CPT)',
      issuer: 'National Healthcareer Association (NHA)',
      description: 'National certification recognized by hospitals, labs, and clinics across the U.S. Covers venipuncture, capillary puncture, specimen handling, and patient interaction.',
      validity: '2 years (renewable with CE)',
    },
    {
      name: 'CPR / BLS for Healthcare Providers',
      issuer: 'American Heart Association',
      description: 'Basic Life Support certification required by all healthcare employers.',
      validity: '2 years',
    },
    {
      name: 'Bloodborne Pathogens Certificate',
      issuer: 'OSHA / Elevate for Humanity',
      description: 'OSHA-compliant training in bloodborne pathogen exposure prevention.',
      validity: '1 year',
    },
  ],

  outcomes: [
    { statement: 'Perform venipuncture and capillary puncture safely and accurately' },
    { statement: 'Handle, label, and process blood specimens per lab protocol' },
    { statement: 'Communicate effectively with patients to reduce anxiety and improve compliance' },
    { statement: 'Follow infection control and OSHA safety standards' },
    { statement: 'Pass the NHA CPT national certification exam' },
  ],

  careerOutcomes: [
    { title: 'Phlebotomist', employer: 'Hospital / Lab', salaryRange: '$32,000–$42,000', hiringRate: '92%' },
    { title: 'Lab Assistant', employer: 'Clinical Laboratory', salaryRange: '$30,000–$40,000', hiringRate: '88%' },
    { title: 'Patient Services Tech', employer: 'Outpatient Clinic', salaryRange: '$31,000–$41,000', hiringRate: '85%' },
  ],

  curriculum: [
    {
      week: 1,
      title: 'Foundations of Phlebotomy',
      topics: ['Anatomy of the venous system', 'Medical terminology', 'Infection control and PPE', 'Patient identification and consent'],
      hours: 30,
    },
    {
      week: 2,
      title: 'Venipuncture Technique',
      topics: ['Vacutainer and syringe methods', 'Butterfly needle technique', 'Order of draw', 'Difficult draws and complications'],
      hours: 30,
    },
    {
      week: 3,
      title: 'Capillary Puncture & Specimen Handling',
      topics: ['Fingerstick and heelstick technique', 'Specimen labeling and chain of custody', 'Centrifuge operation', 'Specimen rejection criteria'],
      hours: 30,
    },
    {
      week: 4,
      title: 'Clinical Practice & Exam Prep',
      topics: ['Supervised clinical draws', 'NHA CPT exam review', 'Practice exams', 'Career readiness and job search'],
      hours: 30,
    },
  ],

  laborMarketStats: {
    jobOpenings: '28,000+',
    medianWage: '$37,380',
    projectedGrowth: '10% (faster than average)',
    source: 'Bureau of Labor Statistics, 2024',
  },

  laborMarket: {
    medianSalary: 37380,
    salaryRange: '$30,000–$45,000',
    growthRate: '10% (faster than average)',
    source: 'U.S. Bureau of Labor Statistics',
    sourceYear: 2024,
    region: 'Indianapolis-Carmel-Anderson MSA',
  },

  complianceAlignment: [
    { framework: 'OSHA Bloodborne Pathogens Standard (29 CFR 1910.1030)', description: 'Full compliance training included' },
    { framework: 'HIPAA Patient Privacy', description: 'Patient data handling and confidentiality' },
    { framework: 'CLSI Standards', description: 'Clinical and Laboratory Standards Institute venipuncture guidelines' },
  ],

  prerequisites: 'No prior healthcare experience required. Must be 18+ and have a high school diploma or GED.',

  whatYouNeed: [
    'High school diploma or GED',
    'Government-issued photo ID',
    'Comfortable closed-toe shoes for lab days',
    'Basic computer access for online coursework',
  ],

  includedItems: [
    'All course materials and lab supplies',
    'NHA CPT exam voucher',
    'CPR/BLS certification',
    'Bloodborne Pathogens certificate',
    'Career placement support',
  ],

  paymentTerms: 'Self-pay program. $1,500 total tuition. 20% deposit ($300) required at enrollment. Pay the balance weekly, in full, or via BNPL (Affirm, Sezzle, Afterpay, Klarna).',

  // ─── Content model ──────────────────────────────────────────────
  deliveryModel: 'internal',
  deliveryModelDetail: 'internal_lms',
  fundingOptions: ['self_pay'],
  enrollmentType: 'internal',

  careerPathway: [
    { title: 'Phlebotomist', timeframe: '0–3 months', requirements: 'CPT certification + background check', salaryRange: '$32,000–$42,000' },
    { title: 'Lead Phlebotomist / Supervisor', timeframe: '2–4 years', requirements: 'Experience + leadership skills', salaryRange: '$40,000–$52,000' },
    { title: 'Medical Laboratory Technician', timeframe: '2–3 years', requirements: 'Additional MLT training', salaryRange: '$45,000–$58,000' },
  ],

  weeklySchedule: [
    { week: 'Weeks 1–2', title: 'Anatomy & Blood Collection Fundamentals', competencyMilestone: 'Identify venipuncture sites and demonstrate proper technique on mannequin' },
    { week: 'Weeks 3–4', title: 'Specimen Handling & Safety', competencyMilestone: 'Process and label specimens correctly; pass OSHA bloodborne pathogens assessment' },
    { week: 'Week 5', title: 'Clinical Practicum & Certification Prep', competencyMilestone: 'Complete 50 supervised venipunctures; pass NHA CPT practice exam' },
  ],

  employerPartners: ['IU Health', 'Eskenazi Health', 'Community Health Network', 'Clinical laboratories'],

  faqs: [
    {
      question: 'Do I need healthcare experience?',
      answer: 'No. This program starts from the basics. You will practice venipuncture on training arms before moving to supervised clinical draws.',
    },
    {
      question: 'What is the NHA CPT exam?',
      answer: 'The NHA Certified Phlebotomy Technician exam is a 100-question multiple-choice test covering anatomy, venipuncture technique, specimen handling, and safety. It is proctored at Elevate.',
    },
    {
      question: 'Is this program covered by WIOA or state grants?',
      answer: 'The Phlebotomy program is self-pay. It is not currently on the Indiana ETPL. Flexible payment plans and BNPL options are available.',
    },
    {
      question: 'Can I work in other states with this certification?',
      answer: 'Most states do not require phlebotomists to hold a state license — national certification (NHA CPT) is accepted by employers. California, Louisiana, Nevada, and Washington require additional state licensure. Use the state licensing tool on this page to check your state.',
    },
    {
      question: 'How quickly can I get a job after completing the program?',
      answer: 'Most graduates receive job offers within 2–4 weeks of passing the NHA CPT exam. Hospitals, labs, blood banks, and outpatient clinics hire phlebotomists year-round.',
    },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Healthcare', href: '/programs/healthcare' },
    { label: 'Phlebotomy' },
  ],

  cta: {
    applyHref: '/apply?program=phlebotomy',
    requestInfoHref: '/programs/phlebotomy/request-info',
    careerConnectHref: 'https://www.indianacareerconnect.com/jobs/search?q=phlebotomist&location=Indiana',
    advisorHref: '/contact',
  },

  metaTitle: 'Phlebotomy Training | NHA CPT Certification | Indianapolis Indiana',
  metaDescription: '4-week phlebotomy program in Indianapolis. Prepare for the NHA Certified Phlebotomy Technician (CPT) exam. 120 hours, self-pay $1,500 with flexible payment plans.',

  enrollmentTracks: {
    funded: {
      label: 'Indiana Residents — Workforce Funded',
      requirement: 'Must reside in Indiana',
      description:
        'Indiana residents may qualify for tuition assistance through WorkOne or other workforce programs. Eligibility is verified before a seat is confirmed. Check with your WorkOne case manager — the Phlebotomy program is not currently on the Indiana ETPL.',
      applyHref: '/apply?program=phlebotomy&track=funded',
      available: true,
    },
    selfPay: {
      label: 'All States — Self-Pay',
      cost: '$1,500',
      description:
        'Students from any state may enroll through the self-pay option. Most states do not require phlebotomists to hold a state license — the NHA CPT national certification is accepted by employers nationwide. Use the state licensing tool below to check your state.',
      applyHref: '/apply?program=phlebotomy&track=self-pay',
      available: true,
    },
  },
};
