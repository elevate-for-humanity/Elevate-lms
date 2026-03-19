import type { ProgramSchema } from '@/lib/programs/program-schema';

export const BEAUTY_CAREER_EDUCATOR: ProgramSchema = {
  slug: 'beauty-career-educator',
  title: 'Beauty & Career Educator Training',
  subtitle: '12-week hybrid program combining salon services, peer teaching, entrepreneurship, and workforce readiness.',
  sector: 'personal-services',
  category: 'Beauty & Personal Services',
  heroImage: '/images/pages/barber-styling-hair.jpg',
  heroImageAlt: 'Beauty educator training students in salon techniques',
  videoSrc: '/videos/beauty-cosmetology.mp4',
  deliveryMode: 'hybrid',
  durationWeeks: 12,
  hoursPerWeekMin: 15,
  hoursPerWeekMax: 20,
  hoursBreakdown: { onlineInstruction: 72, handsOnLab: 96, examPrep: 12, careerPlacement: 12 },
  schedule: 'Hybrid — flexible scheduling with monthly/quarterly cohorts',
  cohortSize: '10–15 participants per cohort',
  fundingStatement: '$0 with WIOA or Workforce Ready Grant. Self-pay: $4,730.',
  selfPayCost: '$4,730',
  badge: 'ETPL Approved',
  badgeColor: 'green',

  credentials: [
    { name: 'Rise Up Career Readiness Credential', issuer: 'Rise Up', description: 'Nationally recognized career readiness certification for workforce entry.', validity: 'Lifetime' },
    { name: 'CPR/First Aid Certification', issuer: 'American Red Cross', description: 'Emergency response certification required for salon and educator roles.', validity: '2 years' },
    { name: 'OSHA 10-Hour Safety Certification', issuer: 'CareerSafe', description: 'OSHA-authorized workplace safety training.', validity: 'Lifetime' },
  ],

  outcomes: [
    { statement: 'Perform manicuring techniques and nail care services to industry standard', assessedAt: 'Week 4' },
    { statement: 'Apply infection control and sanitation protocols in salon settings', assessedAt: 'Week 3' },
    { statement: 'Facilitate a peer teaching session or community workshop', assessedAt: 'Week 8' },
    { statement: 'Develop a basic business plan for an independent beauty service', assessedAt: 'Week 10' },
    { statement: 'Pass the Rise Up Career Readiness assessment', assessedAt: 'Week 12' },
  ],

  careerPathway: [
    { title: 'Independent Beauty Contractor', timeframe: '0–3 months', requirements: 'Program completion + Rise Up credential', salaryRange: '$28,000–$45,000' },
    { title: 'Salon Educator / Trainer', timeframe: '6–18 months', requirements: 'Experience + teaching portfolio', salaryRange: '$35,000–$50,000' },
    { title: 'Beauty Business Owner', timeframe: '1–3 years', requirements: 'Business plan + capital', salaryRange: '$40,000–$70,000+' },
  ],

  weeklySchedule: [
    { week: 'Weeks 1–3', title: 'Salon Foundations & Sanitation', competencyMilestone: 'Apply infection control protocols in a simulated salon setting' },
    { week: 'Weeks 4–6', title: 'Nail Care & Client Services', competencyMilestone: 'Perform manicuring techniques and client consultation' },
    { week: 'Weeks 7–9', title: 'Peer Teaching & Workshop Facilitation', competencyMilestone: 'Facilitate a 30-minute peer teaching session' },
    { week: 'Weeks 10–11', title: 'Entrepreneurship & Business Planning', competencyMilestone: 'Complete a one-page business plan for a beauty service' },
    { week: 'Week 12', title: 'Career Readiness & Certification', competencyMilestone: 'Pass Rise Up Career Readiness assessment' },
  ],

  curriculum: [
    { title: 'Salon Services Fundamentals', topics: ['Manicuring techniques', 'Nail care and polish application', 'Customer service in salon settings', 'Infection control and sanitation', 'Professional appearance standards'] },
    { title: 'Peer Teaching & Education', topics: ['Instructional design basics', 'Community workshop facilitation', 'Presentation and communication skills', 'Mentorship and leadership', 'Curriculum development for peer programs'] },
    { title: 'Entrepreneurship & Business', topics: ['Business planning fundamentals', 'Independent contractor setup', 'Pricing and service menus', 'Marketing and social media', 'Financial literacy for small business'] },
    { title: 'Career Readiness', topics: ['Resume and portfolio building', 'Interview preparation', 'Workplace professionalism', 'Digital professionalism', 'Rise Up credential preparation'] },
    { title: 'Safety & Compliance', topics: ['OSHA 10 workplace safety', 'CPR and First Aid', 'Chemical safety in salon environments', 'Client documentation and consent', 'HIPAA awareness for service providers'] },
  ],

  complianceAlignment: [
    { standard: 'ETPL Program ID #10004648', description: 'Approved on Indiana ETPL for WIOA Individual Training Account funding.' },
    { standard: 'WIOA Title I', description: 'Program meets WIOA eligibility requirements for workforce funding.' },
    { standard: 'CIP Code 13.1319', description: 'Technical Teacher Education classification.' },
  ],

  laborMarket: { medianSalary: 38000, salaryRange: '$28,000–$55,000', growthRate: '11% (faster than average)', source: 'U.S. Bureau of Labor Statistics', sourceYear: 2024, region: 'Indiana' },

  careers: [
    { title: 'Independent Beauty Contractor', salary: '$28,000–$45,000' },
    { title: 'Salon Educator', salary: '$35,000–$50,000' },
    { title: 'Peer Educator / Community Trainer', salary: '$32,000–$45,000' },
    { title: 'Beauty Business Owner', salary: '$40,000–$70,000+' },
  ],

  cta: {
    applyHref: '/apply?program=beauty-career-educator',
    requestInfoHref: '/programs/beauty-career-educator/request-info',
    advisorHref: '/contact',
  },

  // ─── Content model ──────────────────────────────────────────────
  deliveryModel: 'partner',
  partnerCourses: [
    {
      courseId: 'milady-cosmetology',
      label: 'Milady Standard Cosmetology — Salon Services Module',
      partnerName: 'Milady/Cengage',
      credentialIssued: 'Cosmetology Certificate',
      duration: 'Integrated across 12 weeks',
      required: true,
      enrollmentUrl: 'https://www.milady.com/cosmetology',
    },
  ],
  microCourses: [
    {
      courseId: 'hsi-cpr-aed',
      label: 'CPR/First Aid Certification',
      partnerName: 'American Red Cross / HSI',
      credentialIssued: 'CPR/First Aid Certificate',
      duration: '4 hours',
      required: true,
      enrollmentUrl: 'https://www.hsi.com/courses/cpr-aed',
    },
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

  admissionRequirements: ['16 years or older', 'No prior beauty experience required', 'High school diploma or GED preferred but not required'],
  equipmentIncluded: 'Nail care kit, sanitation supplies, and course materials provided.',
  modality: 'Hybrid — online coursework plus in-person practical training and workshops.',
  facilityInfo: 'Elevate training center, Indianapolis. Monthly cohort start dates.',
  employerPartners: ['Independent salon owners', 'Community organizations', 'Workforce development agencies'],
  pricingIncludes: ['All course materials', 'Rise Up credential exam fee', 'CPR/First Aid certification', 'OSHA 10 certification', 'Career placement support'],
  paymentTerms: 'WIOA and Workforce Ready Grant accepted. Self-pay: $4,730 with payment plans available.',

  faqs: [
    { question: 'Do I need a cosmetology license for this program?', answer: 'No. This is a non-licensure certificate program. You will earn industry-recognized credentials without needing a state cosmetology license.' },
    { question: 'What is the Rise Up credential?', answer: 'Rise Up is a nationally recognized career readiness certification from the National Retail Federation Foundation. It validates workplace readiness skills valued by employers.' },
    { question: 'Can I use WIOA funding?', answer: 'Yes. This program is ETPL-approved (Program ID #10004648) and eligible for WIOA Individual Training Accounts. Contact your local WorkOne office to apply.' },
  ],

  breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Programs', href: '/programs' }, { label: 'Beauty & Career Educator' }],
  metaTitle: 'Beauty & Career Educator Training | ETPL Approved | Indianapolis',
  metaDescription: 'Earn your Rise Up credential, CPR/First Aid, and OSHA 10 in 12 weeks. WIOA-funded beauty and career educator training in Indianapolis.',
};
