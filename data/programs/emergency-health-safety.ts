import type { ProgramSchema } from '@/lib/programs/program-schema';

export const EMERGENCY_HEALTH_SAFETY: ProgramSchema = {
  slug: 'emergency-health-safety',
  title: 'Emergency Health & Safety Technician',
  subtitle: '4-week hybrid program. Earn EMR, CPR/AED, First Aid, and OSHA 10 certifications for healthcare and public safety careers.',
  sector: 'healthcare',
  category: 'Emergency Response',
  heroImage: '/images/pages/cpr-aed.jpg',
  heroImageAlt: 'Emergency medical responder providing care',
  videoSrc: '/videos/healthcare-cna.mp4',
  deliveryMode: 'hybrid',
  durationWeeks: 4,
  hoursPerWeekMin: 20,
  hoursPerWeekMax: 25,
  hoursBreakdown: { onlineInstruction: 30, handsOnLab: 40, examPrep: 8, careerPlacement: 2 },
  schedule: 'Monthly cohorts — full-time intensive, day or evening options',
  cohortSize: '10–15 participants per cohort',
  fundingStatement: '$0 with WIOA or Workforce Ready Grant. Self-pay: $4,950.',
  selfPayCost: '$4,950',
  badge: 'ETPL Approved',
  badgeColor: 'green',

  credentials: [
    { name: 'Emergency Medical Responder (EMR)', issuer: 'National Registry of Emergency Medical Technicians (NREMT)', description: 'Entry-level emergency medical certification recognized nationally.', validity: '2 years' },
    { name: 'CPR/AED/First Aid Certification', issuer: 'American Heart Association', description: 'BLS-level CPR, AED operation, and first aid for healthcare and public safety settings.', validity: '2 years' },
    { name: 'OSHA 10-Hour Safety Certification', issuer: 'CareerSafe', description: 'OSHA-authorized workplace safety training for healthcare and public safety environments.', validity: 'Lifetime' },
  ],

  outcomes: [
    { statement: 'Perform CPR and operate an AED on adult, child, and infant mannequins', assessedAt: 'Week 1' },
    { statement: 'Conduct a patient assessment and triage in a simulated emergency scenario', assessedAt: 'Week 2' },
    { statement: 'Apply first aid for trauma, burns, fractures, and allergic reactions', assessedAt: 'Week 2' },
    { statement: 'Demonstrate OSHA 10 workplace safety compliance knowledge', assessedAt: 'Week 3' },
    { statement: 'Pass the NREMT Emergency Medical Responder written and practical exam', assessedAt: 'Week 4' },
  ],

  careerPathway: [
    { title: 'Emergency Health & Safety Technician', timeframe: '0–3 months', requirements: 'EMR + CPR/AED + OSHA 10', salaryRange: '$32,000–$42,000' },
    { title: 'EMT-Basic', timeframe: '6–12 months', requirements: 'EMR + EMT program + NREMT', salaryRange: '$36,000–$48,000' },
    { title: 'Paramedic', timeframe: '2–4 years', requirements: 'EMT + Paramedic program', salaryRange: '$45,000–$65,000' },
    { title: 'Healthcare Safety Officer', timeframe: '3–5 years', requirements: 'Experience + additional certifications', salaryRange: '$50,000–$70,000' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'CPR, AED & First Aid', competencyMilestone: 'Pass AHA CPR/AED skills evaluation' },
    { week: 'Week 2', title: 'Emergency Medical Response', competencyMilestone: 'Complete patient assessment and triage simulation' },
    { week: 'Week 3', title: 'OSHA 10 & Workplace Safety', competencyMilestone: 'Pass OSHA 10 knowledge assessment' },
    { week: 'Week 4', title: 'EMR Exam Prep & Certification', competencyMilestone: 'Pass NREMT EMR written and practical exam' },
  ],

  curriculum: [
    { title: 'CPR & AED', topics: ['Adult, child, and infant CPR', 'AED pad placement and operation', 'Team CPR and rescue breathing', 'Special situations (water, pacemaker)', 'AHA BLS standards'] },
    { title: 'First Aid', topics: ['Bleeding control and wound care', 'Burns and electrical injuries', 'Fractures and sprains', 'Allergic reactions and anaphylaxis', 'Stroke and cardiac emergency recognition'] },
    { title: 'Emergency Medical Response', topics: ['Patient assessment and triage', 'Scene safety and incident command', 'Airway management', 'Shock recognition and treatment', 'Medical terminology and documentation'] },
    { title: 'OSHA 10 Workplace Safety', topics: ['OSHA standards and regulations', 'Hazard identification and control', 'Personal protective equipment', 'Bloodborne pathogens', 'Emergency action plans'] },
    { title: 'Public Health & Infection Control', topics: ['Infection control protocols', 'Bloodborne pathogen exposure prevention', 'Public health emergency awareness', 'Documentation and reporting', 'Communication with EMS professionals'] },
  ],

  complianceAlignment: [
    { standard: 'ETPL Program ID #10004621', description: 'Approved on Indiana ETPL for WIOA Individual Training Account funding.' },
    { standard: 'NREMT EMR Standards', description: 'Curriculum aligned to National Registry of Emergency Medical Technicians EMR competencies.' },
    { standard: 'AHA Guidelines 2020', description: 'CPR/AED training follows current American Heart Association guidelines.' },
    { standard: 'CIP Code 51.0999', description: 'Allied Health Diagnostic, Intervention, and Treatment Professions classification.' },
  ],

  laborMarket: { medianSalary: 38000, salaryRange: '$32,000–$65,000', growthRate: '7% (faster than average)', source: 'U.S. Bureau of Labor Statistics', sourceYear: 2024, region: 'Indiana' },

  careers: [
    { title: 'Emergency Health & Safety Technician', salary: '$32,000–$42,000' },
    { title: 'EMT-Basic', salary: '$36,000–$48,000' },
    { title: 'Healthcare Safety Officer', salary: '$50,000–$70,000' },
    { title: 'Public Safety Dispatcher', salary: '$38,000–$52,000' },
  ],

  cta: {
    applyHref: '/apply?program=emergency-health-safety',
    requestInfoHref: '/programs/emergency-health-safety/request-info',
    careerConnectHref: 'https://www.indianacareerconnect.com/jobs/search?q=emergency+medical+responder&location=Indiana',
    advisorHref: '/contact',
  },

  // ─── Content model ──────────────────────────────────────────────
  deliveryModel: 'partner',
  partnerCourses: [
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
      courseId: 'hsi-first-aid',
      label: 'First Aid Certification',
      partnerName: 'Health & Safety Institute / AHA',
      credentialIssued: 'AHA Heartsaver First Aid Certificate',
      duration: '4 hours',
      required: true,
      enrollmentUrl: 'https://www.hsi.com/courses/first-aid',
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
    {
      courseId: 'careersafe-bloodborne-pathogens',
      label: 'Bloodborne Pathogens Training',
      partnerName: 'CareerSafe',
      credentialIssued: 'Bloodborne Pathogens Certificate',
      duration: '1 hour',
      required: true,
      enrollmentUrl: 'https://www.careersafeonline.com/bloodborne-pathogens',
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

  admissionRequirements: ['18 years or older', 'High school diploma or GED', 'No prior medical training required', 'Physical ability to perform CPR'],
  equipmentIncluded: 'CPR mannequin access, AED trainer, and all course materials provided.',
  modality: 'Hybrid — online theory modules plus in-person hands-on skills training.',
  facilityInfo: 'Elevate training center, Indianapolis. Monthly cohort start dates.',
  employerPartners: ['Hospitals and healthcare systems', 'Schools and childcare centers', 'Construction and manufacturing employers', 'Public safety agencies'],
  pricingIncludes: ['All course materials', 'NREMT EMR exam fee', 'AHA CPR/AED/First Aid certification', 'OSHA 10 certification', 'Career placement support'],
  paymentTerms: 'WIOA and Workforce Ready Grant accepted. Self-pay: $4,950 with payment plans available.',

  faqs: [
    { question: 'What is an Emergency Medical Responder?', answer: 'An EMR is the entry-level NREMT certification. EMRs provide immediate life-saving care before and during EMS arrival. It is the first step toward becoming an EMT or Paramedic.' },
    { question: 'Is this program WIOA-funded?', answer: 'Yes. This program is ETPL-approved (Program ID #10004621) and eligible for WIOA Individual Training Accounts. Contact your local WorkOne office to apply.' },
    { question: 'What jobs can I get after this program?', answer: 'Graduates work in schools, hospitals, construction sites, manufacturing facilities, public safety agencies, and community health organizations.' },
  ],

  breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Programs', href: '/programs' }, { label: 'Emergency Health & Safety Technician' }],
  metaTitle: 'Emergency Health & Safety Technician | EMR + OSHA 10 | Indianapolis',
  metaDescription: 'Earn EMR, CPR/AED, First Aid, and OSHA 10 certifications in 4 weeks. WIOA-funded Emergency Health & Safety Technician program in Indianapolis.',
};
