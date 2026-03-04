import type { ProgramSchema } from '@/lib/programs/program-schema';

/**
 * Pharmacy Technician — Program Detail Template v1
 * Hours math: 10 weeks × 18–22 hrs/week = 180–220 hours
 */
export const PHARMACY_TECHNICIAN: ProgramSchema = {
  slug: 'pharmacy-technician',
  title: 'Pharmacy Technician',
  subtitle: 'Prepare for the PTCB Certified Pharmacy Technician (CPhT) exam. Learn medication dispensing, pharmacy law, sterile compounding, and inventory management in 10 weeks.',
  sector: 'healthcare',
  category: 'Healthcare',

  heroImage: '/images/programs-hq/healthcare-hero.jpg',
  heroImageAlt: 'Pharmacy technician preparing medication in a pharmacy setting',

  deliveryMode: 'hybrid',
  durationWeeks: 10,
  hoursPerWeekMin: 18,
  hoursPerWeekMax: 22,
  hoursBreakdown: {
    onlineInstruction: 80,
    handsOnLab: 80,
    examPrep: 25,
    careerPlacement: 15,
  },
  schedule: 'Mon–Fri, 9:00 AM–1:00 PM (20 hrs/week)',
  eveningSchedule: 'Evening cohorts available.',
  cohortSize: '12–16 participants per cohort',
  fundingStatement: '$0 with WIOA funding. Next Level Jobs accepted.',
  selfPayCost: '$4,200 (payment plans available)',
  badge: 'Funding Available',
  badgeColor: 'green',

  credentials: [
    {
      name: 'PTCB Certified Pharmacy Technician (CPhT)',
      issuer: 'Pharmacy Technician Certification Board (PTCB)',
      description: 'National certification recognized by all 50 states. Required for employment in most pharmacy settings.',
      validity: '2 years (60 CE hours to renew)',
    },
    {
      name: 'ExCPT Certification',
      issuer: 'National Healthcareer Association (NHA)',
      description: 'Alternative national pharmacy technician certification accepted by major retail and hospital pharmacies.',
      validity: '2 years',
    },
    {
      name: 'Sterile Compounding Certificate',
      issuer: 'Elevate for Humanity',
      description: 'Competency-based assessment covering USP 797 sterile compounding procedures and aseptic technique.',
    },
    {
      name: 'CPR / First Aid / AED',
      issuer: 'American Heart Association',
      description: 'Nationally accredited emergency response certification required by most healthcare employers.',
      validity: '2 years',
    },
    {
      name: 'HIPAA Compliance Certificate',
      issuer: 'Elevate for Humanity',
      description: 'Training in patient privacy, PHI handling, and HIPAA regulations for pharmacy settings.',
    },
  ],

  outcomes: [
    { statement: 'Accurately fill prescriptions using NDC numbers and sig codes with zero dispensing errors on practical exam', assessedAt: 'Week 8' },
    { statement: 'Calculate dosages for oral, injectable, and IV medications using dimensional analysis', assessedAt: 'Week 4' },
    { statement: 'Perform aseptic technique and sterile compounding per USP 797 standards', assessedAt: 'Week 7' },
    { statement: 'Identify 200 top medications by brand/generic name, classification, and common side effects', assessedAt: 'Week 9' },
    { statement: 'Process insurance claims and resolve third-party rejections using pharmacy software', assessedAt: 'Week 6' },
    { statement: 'Pass PTCB practice exam with 80% or higher (90 questions, 2 hours)', assessedAt: 'Week 10' },
    { statement: 'Apply federal and state pharmacy law including DEA schedules I–V and controlled substance handling', assessedAt: 'Week 5' },
  ],

  careerPathway: [
    {
      title: 'Pharmacy Technician (Entry)',
      timeframe: '0–6 months after certification',
      requirements: 'CPhT or ExCPT certification (earned in program)',
      salaryRange: '$32,000–$38,000',
    },
    {
      title: 'Senior Pharmacy Technician',
      timeframe: '1–3 years',
      requirements: '1+ year experience + specialized training (IV, chemo)',
      salaryRange: '$38,000–$45,000',
    },
    {
      title: 'Lead Pharmacy Technician / Supervisor',
      timeframe: '3–5 years',
      requirements: 'Advanced certification (CSPT, CPhT-Adv) + leadership',
      salaryRange: '$45,000–$55,000',
    },
    {
      title: 'Pharmacy Operations Manager',
      timeframe: '5+ years',
      requirements: 'Management experience + advanced certifications',
      salaryRange: '$55,000–$70,000',
    },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'Pharmacy Foundations', competencyMilestone: 'Identify pharmacy settings, roles, and workflow. Pass HIPAA assessment.' },
    { week: 'Week 2', title: 'Pharmacy Law & Ethics', competencyMilestone: 'Classify DEA schedules I–V, explain controlled substance handling, identify state-specific regulations.' },
    { week: 'Week 3', title: 'Pharmaceutical Calculations', competencyMilestone: 'Calculate dosages using dimensional analysis, convert between metric/apothecary systems.' },
    { week: 'Week 4', title: 'Pharmacology I', competencyMilestone: 'Identify 100 top medications by brand/generic, classify by drug category.' },
    { week: 'Week 5', title: 'Pharmacology II', competencyMilestone: 'Identify remaining 100 top medications, recognize common drug interactions and side effects.' },
    { week: 'Week 6', title: 'Prescription Processing', competencyMilestone: 'Read and interpret prescriptions, process insurance claims, resolve third-party rejections.' },
    { week: 'Week 7', title: 'Sterile Compounding', competencyMilestone: 'Demonstrate aseptic technique per USP 797, prepare IV admixtures in clean room simulation.' },
    { week: 'Week 8', title: 'Dispensing Practicum', competencyMilestone: 'Fill 50 prescriptions with zero errors using pharmacy software, verify NDC and sig codes.' },
    { week: 'Week 9', title: 'PTCB Exam Prep', competencyMilestone: 'Complete 3 full-length practice exams (90 questions each), score 80%+ consistently.' },
    { week: 'Week 10', title: 'Certification & Placement', competencyMilestone: 'Take proctored PTCB exam, earn CPR/AED, complete mock interviews and resume workshop.' },
  ],

  curriculum: [
    {
      title: 'Pharmacy Foundations & Law',
      topics: ['Pharmacy settings: retail, hospital, mail-order, compounding', 'Pharmacy technician roles and scope of practice', 'Federal pharmacy law: FDCA, CSA, OBRA-90, Combat Methamphetamine Act', 'State-specific regulations and Board of Pharmacy requirements', 'HIPAA and patient privacy in pharmacy', 'DEA schedules I–V and controlled substance handling'],
    },
    {
      title: 'Pharmaceutical Calculations',
      topics: ['Metric system conversions', 'Dimensional analysis for dosage calculations', 'Concentration and dilution calculations', 'IV flow rate calculations (mL/hr, gtt/min)', 'Pediatric and weight-based dosing', 'Business math: markup, discount, inventory turnover'],
    },
    {
      title: 'Pharmacology',
      topics: ['Drug classification systems', 'Top 200 medications: brand/generic names', 'Mechanism of action by drug class', 'Common side effects and contraindications', 'Drug interactions and therapeutic duplications', 'OTC medications and patient counseling boundaries'],
    },
    {
      title: 'Prescription Processing & Insurance',
      topics: ['Reading and interpreting prescriptions', 'Sig codes and medical abbreviations', 'NDC numbers and drug identification', 'Third-party insurance processing', 'Prior authorizations and formulary management', 'Pharmacy software systems (simulated)'],
    },
    {
      title: 'Sterile & Non-Sterile Compounding',
      topics: ['USP 797 standards for sterile compounding', 'Aseptic technique and garbing procedures', 'Laminar airflow hood operation', 'IV admixture preparation', 'Non-sterile compounding: creams, suspensions, capsules', 'Quality assurance and beyond-use dating'],
    },
    {
      title: 'Certification Prep & Career Placement',
      topics: ['PTCB exam format: 90 questions, 2 hours, 4 domains', 'Full-length practice exams with score analysis', 'Weak-area review and targeted study plans', 'Resume building for pharmacy positions', 'Mock interviews with pharmacy hiring scenarios', 'Employer introductions and placement support'],
    },
  ],

  complianceAlignment: [
    { standard: 'PTCB Certification', description: 'Program curriculum aligned to PTCB exam content outline across all 4 knowledge domains.' },
    { standard: 'USP 797', description: 'Sterile compounding training follows United States Pharmacopeia Chapter 797 standards.' },
    { standard: 'WIOA Title I', description: 'Program eligible for Workforce Innovation and Opportunity Act funding through Indiana DWD.' },
    { standard: 'Indiana Board of Pharmacy', description: 'Training meets Indiana requirements for pharmacy technician registration.' },
    { standard: 'ETPL Listed', description: 'Eligible Training Provider List — approved for Individual Training Accounts through local workforce boards.' },
  ],

  laborMarket: {
    medianSalary: 37790,
    salaryRange: '$30,000–$50,000',
    growthRate: '+6% (faster than average)',
    source: 'U.S. Bureau of Labor Statistics, Occupational Outlook Handbook',
    sourceYear: 2024,
    region: 'Indiana',
  },
  careers: [
    { title: 'Retail Pharmacy Technician', salary: '$32,000–$40,000' },
    { title: 'Hospital Pharmacy Technician', salary: '$36,000–$48,000' },
    { title: 'Compounding Pharmacy Technician', salary: '$38,000–$50,000' },
    { title: 'Mail-Order Pharmacy Technician', salary: '$34,000–$42,000' },
    { title: 'Pharmacy Technician Supervisor', salary: '$45,000–$55,000' },
  ],

  cta: {
    applyHref: '/apply?program=pharmacy-technician',
    advisorHref: '/contact',
  },

  admissionRequirements: [
    '18 years or older',
    'High school diploma or GED',
    'Background check (required for pharmacy employment)',
    'No prior pharmacy experience required',
  ],
  equipmentIncluded: 'All training materials, pharmacy software access, compounding supplies, and certification exam fees included',
  modality: 'Hybrid — Online instruction via LMS, hands-on labs at training facility, pharmacy simulation exercises',
  facilityInfo: 'Elevate training center, Indianapolis',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available.',
  employerPartners: [
    'CVS Health',
    'Walgreens',
    'Local independent pharmacies (onboarding)',
  ],
  pricingIncludes: [
    '200 instructional hours (10 weeks)',
    'PTCB exam fee',
    'CPR/First Aid/AED certification',
    'All training materials and pharmacy software access',
    'Sterile compounding lab supplies',
    'LMS access for full program duration',
    'Career placement support',
  ],
  paymentTerms: 'WIOA and Next Level Jobs funding accepted. Payment plans available for self-pay students.',

  faqs: [
    { question: 'Do I need pharmacy experience?', answer: 'No. This program starts from the basics and prepares you for the PTCB national certification exam in 10 weeks.' },
    { question: 'What is the PTCB exam?', answer: 'The Pharmacy Technician Certification Board (PTCB) exam is a 90-question, 2-hour national certification. Passing earns the CPhT credential, recognized by all 50 states and required by most employers.' },
    { question: 'Is this program free?', answer: 'Yes, for eligible participants through WIOA or Next Level Jobs funding. Self-pay is $4,200 with payment plans available.' },
    { question: 'Where can I work after certification?', answer: 'Retail pharmacies (CVS, Walgreens), hospitals, compounding pharmacies, mail-order pharmacies, and long-term care facilities.' },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Healthcare', href: '/programs/healthcare' },
    { label: 'Pharmacy Technician' },
  ],

  metaTitle: 'Pharmacy Technician Training | PTCB Certified | Indianapolis',
  metaDescription: '10-week pharmacy technician program. PTCB CPhT exam prep, sterile compounding, and 5 credentials. 180–220 hours. WIOA funding available.',
};
