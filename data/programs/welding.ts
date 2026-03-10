import type { ProgramSchema } from '@/lib/programs/program-schema';

export const WELDING: ProgramSchema = {
  slug: 'welding',
  title: 'Welding Technology',
  subtitle: 'Learn MIG, TIG, and stick welding. Earn AWS certifications and enter the skilled trades workforce in 10 weeks.',
  sector: 'skilled-trades',
  category: 'Welding & Fabrication',

  heroImage: '/images/pages/welding-sparks.jpg',
  heroImageAlt: 'Welding student practicing MIG welding in a training lab',
  videoSrc: '/videos/welding-trades.mp4',

  deliveryMode: 'hybrid',
  durationWeeks: 10,
  hoursPerWeekMin: 20,
  hoursPerWeekMax: 25,
  hoursBreakdown: { onlineInstruction: 50, handsOnLab: 130, examPrep: 20, careerPlacement: 10 },
  schedule: 'Mon–Fri, 20–25 hours per week',
  cohortSize: '10–14 participants per cohort',
  fundingStatement: '$0 with WIOA or Next Level Jobs funding',
  selfPayCost: '$4,800',
  badge: 'Funding Available',
  badgeColor: 'green',

  credentials: [
    { name: 'AWS D1.1 Structural Welding Certification', issuer: 'American Welding Society', description: 'Industry-standard certification for structural steel welding.', validity: '6 months (retest required)' },
    { name: 'OSHA 10 Construction', issuer: 'OSHA', description: 'Construction safety certification covering hazard recognition.', validity: 'Recommended renewal every 5 years' },
    { name: 'CPR/AED/First Aid', issuer: 'American Heart Association', description: 'Emergency response certification.', validity: '2 years' },
  ],

  outcomes: [
    { statement: 'Produce SMAW (stick) welds passing visual inspection on 3/8" plate in all positions', assessedAt: 'Week 4' },
    { statement: 'Produce GMAW (MIG) welds passing visual inspection on 1/4" plate in flat and horizontal positions', assessedAt: 'Week 6' },
    { statement: 'Produce GTAW (TIG) welds on carbon steel and stainless steel in flat position', assessedAt: 'Week 8' },
    { statement: 'Read and interpret welding symbols on blueprints', assessedAt: 'Week 3' },
    { statement: 'Set up welding equipment and select correct parameters for material and position', assessedAt: 'Week 2' },
  ],

  careerPathway: [
    { title: 'Entry-Level Welder', timeframe: '0–6 months', requirements: 'AWS certification', salaryRange: '$38,000–$48,000' },
    { title: 'Structural Welder', timeframe: '1–2 years', requirements: 'AWS D1.1 + field experience', salaryRange: '$48,000–$62,000' },
    { title: 'Pipe Welder', timeframe: '2–4 years', requirements: 'Pipe welding certification', salaryRange: '$60,000–$85,000' },
    { title: 'Welding Inspector / Supervisor', timeframe: '5+ years', requirements: 'CWI certification', salaryRange: '$70,000–$95,000' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'Welding Safety & Fundamentals', competencyMilestone: 'Set up welding station and identify safety hazards' },
    { week: 'Week 2', title: 'SMAW (Stick) — Flat Position', competencyMilestone: 'Run consistent beads on flat plate with E6010 and E7018' },
    { week: 'Week 3', title: 'Blueprint Reading & Welding Symbols', competencyMilestone: 'Interpret 10 common welding symbols from blueprints' },
    { week: 'Week 4', title: 'SMAW — All Positions', competencyMilestone: 'Pass visual inspection on 3G and 4G welds' },
    { week: 'Week 5', title: 'GMAW (MIG) — Setup & Flat', competencyMilestone: 'Set wire speed and voltage for clean MIG welds on flat plate' },
    { week: 'Week 6', title: 'GMAW — Horizontal & Vertical', competencyMilestone: 'Produce MIG welds passing visual inspection in 2G and 3G' },
    { week: 'Week 7', title: 'GTAW (TIG) — Carbon Steel', competencyMilestone: 'Produce TIG welds on carbon steel in flat position' },
    { week: 'Week 8', title: 'GTAW — Stainless Steel', competencyMilestone: 'Produce TIG welds on stainless steel with proper gas coverage' },
    { week: 'Week 9', title: 'Certification Prep & Practice', competencyMilestone: 'Complete practice certification test plates' },
    { week: 'Week 10', title: 'AWS Certification & Career Placement', competencyMilestone: 'Pass AWS D1.1 certification test' },
  ],

  curriculum: [
    { title: 'Welding Fundamentals', topics: ['Safety and PPE', 'Joint types and positions', 'Electrode selection', 'Metal identification'] },
    { title: 'SMAW (Stick Welding)', topics: ['E6010 and E7018 electrodes', 'Flat, horizontal, vertical, overhead positions', 'Root pass and fill techniques', 'Weld defect identification'] },
    { title: 'GMAW (MIG Welding)', topics: ['Wire feed setup and gas selection', 'Short circuit and spray transfer', 'Multi-pass welding', 'Aluminum MIG basics'] },
    { title: 'GTAW (TIG Welding)', topics: ['Tungsten selection and preparation', 'Carbon steel and stainless steel', 'Filler rod techniques', 'Gas lens and cup selection'] },
    { title: 'Blueprint Reading', topics: ['Welding symbols', 'Dimensional tolerances', 'Material specifications', 'Weld procedure specifications (WPS)'] },
  ],

  complianceAlignment: [
    { standard: 'AWS D1.1 Structural Welding Code', description: 'Certification testing aligned to AWS D1.1 structural steel welding standards.' },
    { standard: 'WIOA Title I', description: 'Program meets WIOA eligibility for Individual Training Accounts.' },
  ],

  trainingPhases: [
    { phase: 1, title: 'Fundamentals & SMAW', weeks: 'Weeks 1–4', focus: 'Safety, stick welding in all positions, and blueprint reading.',
      labCompetencies: ['Set up SMAW station with correct polarity and amperage', 'Run E6010 root pass on open-root joint', 'Run E7018 fill and cap passes', 'Pass visual inspection on 3G vertical weld'] },
    { phase: 2, title: 'GMAW (MIG) Processes', weeks: 'Weeks 5–6', focus: 'MIG welding setup, technique, and multi-position welding.',
      labCompetencies: ['Set wire speed and voltage for 0.035" wire on 1/4" plate', 'Produce fillet welds in flat and horizontal positions', 'Produce groove welds passing visual inspection'] },
    { phase: 3, title: 'GTAW (TIG) Processes', weeks: 'Weeks 7–8', focus: 'TIG welding on carbon steel and stainless steel.',
      labCompetencies: ['Prepare tungsten electrode with correct grind angle', 'Produce TIG fillet welds on carbon steel', 'Produce TIG welds on stainless steel with back purge'] },
    { phase: 4, title: 'Certification & Placement', weeks: 'Weeks 9–10', focus: 'AWS certification testing and employer placement.',
      labCompetencies: ['Complete AWS D1.1 certification test plate', 'Pass bend test on certification coupon', 'Complete welding portfolio for employers'] },
  ],

  credentialPipeline: [
    { training: 'SMAW/GMAW/GTAW training (10 weeks)', certification: 'AWS D1.1 Structural Welding', certBody: 'American Welding Society', jobRole: 'Structural Welder' },
    { training: 'OSHA 10 Construction (Week 1)', certification: 'OSHA 10 DOL Card', certBody: 'U.S. Department of Labor', jobRole: 'Construction Trades Worker' },
  ],

  laborMarket: { medianSalary: 47540, salaryRange: '$38,000–$85,000', growthRate: '2% (slower than average)', source: 'U.S. Bureau of Labor Statistics', sourceYear: 2024, region: 'Indianapolis-Carmel-Anderson MSA' },
  careers: [
    { title: 'Entry-Level Welder', salary: '$38,000–$48,000' },
    { title: 'Structural Welder', salary: '$48,000–$62,000' },
    { title: 'Pipe Welder', salary: '$60,000–$85,000' },
    { title: 'Welding Inspector', salary: '$70,000–$95,000' },
  ],

  cta: { applyHref: '/programs/welding/apply', advisorHref: '/contact', courseHref: '/programs/welding' },
  admissionRequirements: ['18 years or older', 'High school diploma or GED', 'Ability to lift 50 lbs', 'No prior welding experience required'],
  equipmentIncluded: 'Welding helmet, gloves, and all consumables provided. Certification exam fees included.',
  modality: 'Hybrid — Online theory via LMS, hands-on welding lab at Elevate training facility',
  facilityInfo: 'Elevate training center, Indianapolis',
  employerPartners: ['Indianapolis-area fabrication shops', 'Construction contractors', 'Manufacturing employers'],
  pricingIncludes: ['AWS certification exam fees', 'OSHA 10 certification', 'Welding helmet and gloves', 'All consumables and materials', 'Career placement support'],
  paymentTerms: '$0 with WIOA or Next Level Jobs funding. Self-pay: $4,800 or payment plan.',

  faqs: [
    { question: 'Do I need welding experience?', answer: 'No. This program starts from the fundamentals and builds to certification-level skill.' },
    { question: 'What type of welding will I learn?', answer: 'You will learn three processes: SMAW (stick), GMAW (MIG), and GTAW (TIG). These cover the majority of welding jobs.' },
    { question: 'Is funding available?', answer: 'Yes. WIOA and Next Level Jobs funding covers tuition for eligible participants.' },
  ],

  breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Programs', href: '/programs' }, { label: 'Welding Technology' }],
  metaTitle: 'Welding Technology | AWS Certified | Indianapolis',
  metaDescription: 'Learn MIG, TIG, and stick welding. Earn AWS D1.1 certification in 10 weeks. Welders earn $47,540/year. WIOA funding available. Indianapolis.',
};
