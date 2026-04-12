import type { ProgramSchema } from '@/lib/programs/program-schema';

export const HOME_HEALTH_AIDE: ProgramSchema = {
  slug: 'home-health-aide',
  title: 'Home Health Aide Certification',
  subtitle: 'Become a certified Home Health Aide in 4 weeks. Earn CCHW and HHA certifications for in-home care careers.',
  sector: 'healthcare',
  category: 'Home & Community Health',
  heroImage: '/images/pages/healthcare-classroom.jpg',
  heroImageAlt: 'Home health aide assisting elderly client',
  videoSrc: '/videos/cna-hero.mp4',
  deliveryMode: 'hybrid',
  durationWeeks: 4,
  hoursPerWeekMin: 20,
  hoursPerWeekMax: 25,
  hoursBreakdown: { onlineInstruction: 30, handsOnLab: 40, examPrep: 6, careerPlacement: 4 },
  schedule: 'Day or evening options — monthly cohort start dates',
  cohortSize: '10–15 participants per cohort',
  fundingStatement: '$0 with WIOA or Workforce Ready Grant. Self-pay: $4,700.',
  selfPayCost: '$4,700',
  fundingOptions: ['wioa', 'wrg', 'impact', 'self_pay'],
  badge: 'ETPL Approved',
  badgeColor: 'green',

  credentials: [
    { name: 'Home Health Aide (HHA) Certification', issuer: 'Indiana State Department of Health', description: 'State-recognized HHA certification required for employment with licensed home health agencies.', validity: 'Annual renewal' },
    { name: 'Certified Community Healthcare Worker (CCHW)', issuer: 'Indiana State Department of Health', description: 'Community health worker certification for in-home and community care settings.', validity: '2 years' },
    { name: 'CPR/AED Certification', issuer: 'American Heart Association', description: 'BLS-level CPR and AED certification required for all HHA positions.', validity: '2 years' },
  ],

  outcomes: [
    { statement: 'Perform personal care and hygiene assistance following HHA standards', assessedAt: 'Week 2' },
    { statement: 'Accurately measure and record vital signs (blood pressure, pulse, temperature, respiration)', assessedAt: 'Week 2' },
    { statement: 'Apply infection control and bloodborne pathogen protocols in a home setting', assessedAt: 'Week 1' },
    { statement: 'Document client care activities accurately using standard forms', assessedAt: 'Week 3' },
    { statement: 'Demonstrate emergency response procedures including CPR and first aid', assessedAt: 'Week 1' },
  ],

  careerPathway: [
    { title: 'Home Health Aide', timeframe: '0–3 months', requirements: 'HHA certification + CPR', salaryRange: '$28,000–$35,000' },
    { title: 'Personal Care Assistant', timeframe: '0–6 months', requirements: 'CCHW + experience', salaryRange: '$28,000–$36,000' },
    { title: 'Certified Nursing Assistant (CNA)', timeframe: '6–12 months', requirements: 'HHA + CNA program', salaryRange: '$32,000–$42,000' },
    { title: 'Licensed Practical Nurse (LPN)', timeframe: '2–3 years', requirements: 'CNA + LPN program', salaryRange: '$48,000–$60,000' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'Infection Control & Safety', competencyMilestone: 'Demonstrate proper handwashing and PPE use; pass CPR/AED skills evaluation' },
    { week: 'Week 2', title: 'Personal Care & Vital Signs', competencyMilestone: 'Perform personal care assistance and accurately record vital signs' },
    { week: 'Week 3', title: 'Client Communication & Documentation', competencyMilestone: 'Complete a client care documentation exercise with zero critical errors' },
    { week: 'Week 4', title: 'Clinical Practicum & Certification', competencyMilestone: 'Pass HHA and CCHW competency evaluations' },
  ],

  curriculum: [
    { title: 'Infection Control & Safety', topics: ['Handwashing and PPE protocols', 'Bloodborne pathogen exposure prevention', 'Home environment safety assessment', 'Emergency action procedures', 'OSHA standards for home health'] },
    { title: 'Personal Care Skills', topics: ['Bathing and grooming assistance', 'Mobility and transfer techniques', 'Nutrition and meal preparation', 'Medication reminders (not administration)', 'Skin care and pressure injury prevention'] },
    { title: 'Vital Signs & Clinical Skills', topics: ['Blood pressure measurement', 'Pulse and respiration monitoring', 'Temperature measurement', 'Oxygen saturation basics', 'Recognizing and reporting changes in condition'] },
    { title: 'Client Communication & Dignity', topics: ['Person-centered care principles', 'Communication with clients and families', 'Cultural competency in home care', 'Maintaining client dignity and privacy', 'HIPAA compliance in home settings'] },
    { title: 'Documentation & Compliance', topics: ['Care plan documentation', 'Incident reporting', 'Medication reminder logs', 'Agency compliance requirements', 'Electronic health record basics'] },
  ],

  complianceAlignment: [
    { standard: 'ETPL Program ID #10004626', description: 'Approved on Indiana ETPL for WIOA Individual Training Account funding.' },
    { standard: 'Indiana HHA Certification Standards', description: 'Curriculum meets Indiana State Department of Health HHA competency requirements.' },
    { standard: 'WIOA Title I', description: 'Program meets WIOA eligibility requirements for workforce funding.' },
  ],

  laborMarket: { medianSalary: 30180, salaryRange: '$28,000–$42,000', growthRate: '22% (much faster than average)', source: 'U.S. Bureau of Labor Statistics', sourceYear: 2024, region: 'Indiana' },

  careers: [
    { title: 'Home Health Aide', salary: '$28,000–$35,000' },
    { title: 'Personal Care Assistant', salary: '$28,000–$36,000' },
    { title: 'Certified Community Healthcare Worker', salary: '$30,000–$40,000' },
    { title: 'CNA (with additional training)', salary: '$32,000–$42,000' },
  ],

  cta: {
    applyHref: '/apply?program=home-health-aide',
    requestInfoHref: '/programs/home-health-aide/request-info',
    careerConnectHref: 'https://www.indianacareerconnect.com/jobs/search?q=home+health+aide&location=Indiana',
    advisorHref: '/contact',
  },

  // ─── Content model ──────────────────────────────────────────────
  deliveryModel: 'partner',
  partnerCourses: [
    {
      courseId: 'careersafe-patient-safety',
      label: 'Patient Safety & Care',
      partnerName: 'CareerSafe',
      credentialIssued: 'Patient Safety Certificate',
      duration: '2 hours',
      required: true,
      enrollmentUrl: 'https://www.careersafeonline.com/patient-safety',
    },
    {
      courseId: 'hsi-bloodborne-pathogens',
      label: 'Bloodborne Pathogens Training',
      partnerName: 'Health & Safety Institute',
      credentialIssued: 'Bloodborne Pathogens Certificate',
      duration: '2 hours',
      required: true,
      enrollmentUrl: 'https://www.hsi.com/courses/bloodborne-pathogens',
    },
  ],
  microCourses: [
    {
      courseId: 'hsi-cpr-aed',
      label: 'CPR/AED Certification',
      partnerName: 'Health & Safety Institute / AHA',
      credentialIssued: 'AHA BLS CPR/AED Certificate',
      duration: '4 hours',
      required: true,
      enrollmentUrl: 'https://www.hsi.com/courses/cpr-aed',
    },
    {
      courseId: 'careersafe-infection-control',
      label: 'Infection Control & Prevention',
      partnerName: 'CareerSafe',
      credentialIssued: 'Infection Control Certificate',
      duration: '2 hours',
      required: true,
      enrollmentUrl: 'https://www.careersafeonline.com/infection-control',
    },
  ],

  admissionRequirements: ['18 years or older', 'High school diploma or GED', 'Background check required', 'Physical ability to perform patient care tasks'],
  equipmentIncluded: 'All course materials, CPR mannequin access, and clinical supplies provided.',
  modality: 'Hybrid — classroom instruction plus clinical practicum.',
  facilityInfo: 'Elevate training center, Indianapolis. Monthly cohort start dates.',
  employerPartners: ['Home health agencies', 'Assisted living facilities', 'Hospice organizations', 'Hospital home care departments'],
  pricingIncludes: ['All course materials', 'HHA and CCHW certification fees', 'CPR/AED certification', 'Career placement support'],
  paymentTerms: 'WIOA and Workforce Ready Grant accepted. Self-pay: $4,700 with payment plans available.',

  faqs: [
    { question: 'What is the difference between HHA and CNA?', answer: 'HHAs provide personal care in clients\' homes. CNAs work in facilities (hospitals, nursing homes). HHA training is shorter and leads directly to home care employment. Many HHAs later complete CNA training to expand their options.' },
    { question: 'Is this program WIOA-funded?', answer: 'Yes. This program is ETPL-approved (Program ID #10004626) and eligible for WIOA Individual Training Accounts in certain areas. Contact your local WorkOne office to verify eligibility.' },
    { question: 'How quickly can I find work after completing this program?', answer: 'Home health aides are in high demand. Most graduates receive job offers within 2–4 weeks of certification. Elevate provides direct employer connections and placement support.' },
  ],

  breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Programs', href: '/programs' }, { label: 'Home Health Aide' }],
  metaTitle: 'Home Health Aide Certification | HHA + CCHW | Indianapolis',
  metaDescription: 'Earn your HHA and CCHW certifications in 4 weeks. WIOA-funded Home Health Aide program in Indianapolis with direct employer placement.',
};
