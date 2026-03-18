import type { ProgramSchema } from '@/lib/programs/program-schema';

export const ELECTRICAL: ProgramSchema = {
  slug: 'electrical',
  title: 'Electrical Technician',
  subtitle: 'Learn residential and commercial wiring, electrical theory, and NEC code. Graduate with OSHA 30 and NCCER credentials in 12 weeks.',
  sector: 'skilled-trades',
  category: 'Electrical',

  heroImage: '/images/pages/electrical-wiring.jpg',
  heroImageAlt: 'Electrical student working on wiring in a training lab',
  videoSrc: '/videos/electrician-trades.mp4',

  deliveryMode: 'hybrid',
  durationWeeks: 12,
  hoursPerWeekMin: 20,
  hoursPerWeekMax: 25,
  hoursBreakdown: { onlineInstruction: 60, handsOnLab: 140, examPrep: 20, careerPlacement: 20 },
  schedule: 'Mon–Fri, 8:00 AM–12:00 PM (20 hrs/week)',
  eveningSchedule: 'Evening/weekend cohorts available for working adults.',
  cohortSize: '10–15 participants per cohort',
  fundingStatement: 'WIOA and Next Level Jobs funding available for eligible Indiana residents. You must qualify — eligibility is not guaranteed. Self-pay options available.',
  selfPayCost: '$5,000',
  badge: 'Funding Available',
  badgeColor: 'orange',

  credentials: [
    { name: 'OSHA 30-Hour Construction Safety', issuer: 'U.S. Department of Labor', description: 'Construction safety certification covering hazard recognition and prevention.', validity: 'Recommended renewal every 5 years' },
    { name: 'NCCER Core Curriculum', issuer: 'NCCER', description: 'National credential covering construction math, safety, hand/power tools, and employability.', validity: 'Lifetime' },
    { name: 'CPR/AED/First Aid', issuer: 'American Heart Association', description: 'Emergency response certification.', validity: '2 years' },
  ],

  outcomes: [
    { statement: 'Wire a residential service panel to NEC code specifications', assessedAt: 'Week 6' },
    { statement: 'Install branch circuits with proper GFCI and AFCI protection', assessedAt: 'Week 5' },
    { statement: 'Bend and install EMT conduit to specification', assessedAt: 'Week 8' },
    { statement: 'Calculate electrical loads using NEC Article 220', assessedAt: 'Week 4' },
    { statement: 'Identify and correct electrical hazards per OSHA standards', assessedAt: 'Week 2' },
    { statement: 'Read and interpret electrical blueprints and schematics', assessedAt: 'Week 3' },
  ],

  careerPathway: [
    { title: 'Electrician Helper', timeframe: '0–6 months', requirements: 'OSHA 30 + NCCER Core', salaryRange: '$35,000–$45,000' },
    { title: 'Electrical Apprentice', timeframe: '6 months–2 years', requirements: 'Registered apprenticeship', salaryRange: '$40,000–$55,000' },
    { title: 'Residential Electrician', timeframe: '2–4 years', requirements: 'Journeyman license', salaryRange: '$50,000–$70,000' },
    { title: 'Commercial Electrician', timeframe: '4+ years', requirements: 'Journeyman + commercial experience', salaryRange: '$55,000–$75,000' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'Electrical Safety & OSHA', competencyMilestone: 'Identify electrical hazards and demonstrate lockout/tagout' },
    { week: 'Week 2', title: 'Electrical Theory', competencyMilestone: 'Apply Ohm\'s Law to calculate voltage, current, and resistance' },
    { week: 'Week 3', title: 'Blueprint Reading', competencyMilestone: 'Read residential electrical blueprints and identify symbols' },
    { week: 'Week 4', title: 'NEC Code & Load Calculations', competencyMilestone: 'Calculate branch circuit and service loads per NEC 220' },
    { week: 'Week 5', title: 'Residential Wiring — Branch Circuits', competencyMilestone: 'Wire switches, outlets, and fixtures with GFCI protection' },
    { week: 'Week 6', title: 'Residential Wiring — Service Panel', competencyMilestone: 'Wire a residential service panel to code' },
    { week: 'Week 7', title: 'Grounding & Bonding', competencyMilestone: 'Install grounding electrode system per NEC 250' },
    { week: 'Week 8', title: 'Conduit & Commercial Wiring', competencyMilestone: 'Bend and install EMT conduit with proper fill calculations' },
    { week: 'Week 9', title: 'Motor Controls & Three-Phase', competencyMilestone: 'Wire a basic motor starter circuit' },
    { week: 'Week 10', title: 'Fire Alarm & Low Voltage', competencyMilestone: 'Install and test fire alarm initiating devices' },
    { week: 'Week 11', title: 'NCCER Core & Exam Prep', competencyMilestone: 'Pass NCCER Core practice exam with 80%+' },
    { week: 'Week 12', title: 'Certification Testing & Career Placement', competencyMilestone: 'Pass OSHA 30 and NCCER Core certification exams' },
  ],

  curriculum: [
    { title: 'Electrical Theory', topics: ['Ohm\'s Law and Kirchhoff\'s Laws', 'Series and parallel circuits', 'AC vs DC power', 'Voltage, current, resistance', 'Power calculations'] },
    { title: 'Residential Wiring', topics: ['Service entrance and panels', 'Branch circuit wiring', 'Switches, outlets, fixtures', 'GFCI and AFCI protection', 'Grounding and bonding'] },
    { title: 'Commercial Wiring', topics: ['Conduit bending and installation', 'Three-phase power systems', 'Motor controls', 'Lighting systems', 'Fire alarm basics'] },
    { title: 'NEC Code', topics: ['Code book navigation', 'Article 210 — Branch Circuits', 'Article 220 — Load Calculations', 'Article 250 — Grounding', 'Permit and inspection process'] },
    { title: 'Safety & OSHA 30', topics: ['Fall protection', 'Electrical safety and lockout/tagout', 'PPE requirements', 'Hazard communication', 'OSHA 30-Hour certification'] },
    { title: 'Career Readiness', topics: ['NCCER Core Curriculum', 'Tool identification and use', 'Blueprint reading basics', 'Resume and interview prep', 'Apprenticeship application support'] },
  ],

  complianceAlignment: [
    { standard: 'NCCER Standardized Curriculum', description: 'Core curriculum aligned to NCCER national standards for construction trades.' },
    { standard: 'NEC 2023', description: 'Training covers current National Electrical Code requirements.' },
    { standard: 'WIOA Title I', description: 'Program meets WIOA eligibility for Individual Training Accounts.' },
  ],

  trainingPhases: [
    { phase: 1, title: 'Safety & Theory', weeks: 'Weeks 1–3', focus: 'Electrical safety, theory, and blueprint reading.',
      labCompetencies: ['Demonstrate lockout/tagout procedure', 'Calculate circuit loads using Ohm\'s Law', 'Read residential electrical blueprints'] },
    { phase: 2, title: 'Residential Wiring', weeks: 'Weeks 4–7', focus: 'NEC code, branch circuits, service panels, and grounding.',
      labCompetencies: ['Wire a complete branch circuit with GFCI', 'Install a residential service panel', 'Install grounding electrode system'] },
    { phase: 3, title: 'Commercial & Advanced', weeks: 'Weeks 8–10', focus: 'Conduit, three-phase, motor controls, and fire alarm.',
      labCompetencies: ['Bend EMT conduit to specification', 'Wire a motor starter circuit', 'Install fire alarm devices'] },
    { phase: 4, title: 'Certification & Placement', weeks: 'Weeks 11–12', focus: 'NCCER Core exam, OSHA 30, and employer connections.',
      labCompetencies: ['Pass NCCER Core certification exam', 'Complete OSHA 30-Hour course', 'Complete employer-ready portfolio'] },
  ],

  credentialPipeline: [
    { training: 'Electrical Technician (12 weeks)', certification: 'OSHA 30-Hour Construction', certBody: 'U.S. Department of Labor', jobRole: 'Electrician Helper / Apprentice' },
    { training: 'NCCER Core Curriculum', certification: 'NCCER Core Certification', certBody: 'NCCER', jobRole: 'Construction Trades Entry' },
  ],

  laborMarket: { medianSalary: 60240, salaryRange: '$35,000–$75,000', growthRate: '6% (faster than average)', source: 'U.S. Bureau of Labor Statistics', sourceYear: 2024, region: 'Indianapolis-Carmel-Anderson MSA' },
  careers: [
    { title: 'Electrician Helper', salary: '$35,000–$45,000' },
    { title: 'Electrical Apprentice', salary: '$40,000–$55,000' },
    { title: 'Residential Electrician', salary: '$50,000–$70,000' },
    { title: 'Commercial Electrician', salary: '$55,000–$75,000' },
    { title: 'Maintenance Electrician', salary: '$48,000–$65,000' },
  ],

  cta: { applyHref: '/programs/electrical/apply',
    requestInfoHref: '/contact?program=electrical',
    careerConnectHref: 'https://www.indianacareerconnect.com/jobs/search?q=electrician&location=Indiana', advisorHref: '/contact', courseHref: '/programs/electrical' },
  admissionRequirements: ['18 years or older', 'High school diploma or GED (or actively pursuing)', 'Able to lift 50 lbs', 'No prior electrical experience required'],
  equipmentIncluded: 'All PPE, tools, training materials, and certification exam fees included',
  modality: 'Hybrid — In-person hands-on labs, LMS-supported theory, live instructor sessions',
  facilityInfo: 'Elevate training center, Indianapolis',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available.',
  employerPartners: ['Jesse J. Wilkerson & Associates — Architecture & Construction'],
  pricingIncludes: ['240 instructional hours', 'OSHA 30-Hour certification', 'NCCER Core Curriculum certification', 'CPR/First Aid certification', 'All PPE, tools, and materials', 'LMS access', 'Career placement support'],
  paymentTerms: 'WIOA, Next Level Jobs, and WRG funding available for eligible Indiana residents — eligibility not guaranteed. Self-pay pricing available — contact us.',

  faqs: [
    { question: 'Do I need any electrical experience?', answer: 'No. This program starts from zero. You will learn electrical theory, safety, and hands-on wiring from the ground up.' },
    { question: 'Will this make me a licensed electrician?', answer: 'This program prepares you for entry-level positions. Indiana requires 8,000 hours of supervised work experience for a journeyman license. This program gives you the foundation and credentials to start that path.' },
    { question: 'What tools do I need?', answer: 'Basic hand tools are provided during training. WIOA funding may cover tool costs for eligible participants.' },
    { question: 'Is this program eligible for WIOA funding?', answer: 'Yes. Electrical is a high-demand occupation in Indiana. If you qualify for WIOA, your tuition, tools, and supplies are covered at no cost.' },
  ],

  breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Programs', href: '/programs' }, { label: 'Electrical Technician' }],
  metaTitle: 'Electrical Technician Training | OSHA 30 + NCCER | Indianapolis',
  metaDescription: 'Learn residential and commercial wiring in 12 weeks. Earn OSHA 30 and NCCER certifications. Electricians earn $60,240/year. Indianapolis. WIOA funding available for eligible Indiana residents.',
};
