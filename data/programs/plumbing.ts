import type { ProgramSchema } from '@/lib/programs/program-schema';

export const PLUMBING: ProgramSchema = {
  slug: 'plumbing',
  title: 'Plumbing Technician',
  subtitle: 'Install and repair residential and commercial plumbing systems. Earn OSHA 10 and NCCER credentials in 10 weeks.',
  sector: 'skilled-trades',
  category: 'Plumbing',

  heroImage: '/images/pages/comp-pathway-trades.jpg',
  heroImageAlt: 'Plumbing student working on pipe installation',

  deliveryMode: 'hybrid',
  durationWeeks: 10,
  hoursPerWeekMin: 20,
  hoursPerWeekMax: 25,
  hoursBreakdown: { onlineInstruction: 40, handsOnLab: 120, examPrep: 20, careerPlacement: 20 },
  schedule: 'Mon–Fri, 8:00 AM–12:00 PM (20 hrs/week)',
  eveningSchedule: 'Evening/weekend cohorts available for working adults.',
  cohortSize: '10–15 participants per cohort',
  fundingStatement: '$0 with WIOA or Next Level Jobs funding',
  selfPayCost: '$5,000',
  badge: 'Funding Available',
  badgeColor: 'orange',

  credentials: [
    { name: 'OSHA 10-Hour Construction Safety', issuer: 'U.S. Department of Labor', description: 'Construction safety certification covering hazard recognition.', validity: 'Recommended renewal every 5 years' },
    { name: 'NCCER Core Curriculum', issuer: 'NCCER', description: 'National credential covering construction math, safety, hand/power tools, and employability.', validity: 'Lifetime' },
    { name: 'CPR/AED/First Aid', issuer: 'American Heart Association', description: 'Emergency response certification.', validity: '2 years' },
  ],

  outcomes: [
    { statement: 'Install copper, PVC, and PEX piping systems to code', assessedAt: 'Week 4' },
    { statement: 'Assemble and test a drain-waste-vent (DWV) system', assessedAt: 'Week 5' },
    { statement: 'Install residential plumbing fixtures (toilet, sink, shower)', assessedAt: 'Week 7' },
    { statement: 'Calculate pipe sizing for water supply systems', assessedAt: 'Week 3' },
    { statement: 'Identify and apply Indiana Plumbing Code requirements', assessedAt: 'Week 6' },
  ],

  careerPathway: [
    { title: 'Plumber Helper', timeframe: '0–6 months', requirements: 'OSHA 10 + NCCER Core', salaryRange: '$32,000–$42,000' },
    { title: 'Plumbing Apprentice', timeframe: '6 months–2 years', requirements: 'Registered apprenticeship', salaryRange: '$38,000–$50,000' },
    { title: 'Residential Plumber', timeframe: '2–4 years', requirements: 'Journeyman license', salaryRange: '$50,000–$70,000' },
    { title: 'Commercial Plumber', timeframe: '4+ years', requirements: 'Journeyman + commercial experience', salaryRange: '$55,000–$75,000' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'Plumbing Safety & Tools', competencyMilestone: 'Identify plumbing tools and demonstrate safe use' },
    { week: 'Week 2', title: 'Pipe Materials & Joining', competencyMilestone: 'Solder copper, cement PVC, and crimp PEX connections' },
    { week: 'Week 3', title: 'Water Supply Systems', competencyMilestone: 'Calculate pipe sizing for residential water supply' },
    { week: 'Week 4', title: 'Pipe Installation Lab', competencyMilestone: 'Install copper and PVC piping to code specifications' },
    { week: 'Week 5', title: 'DWV Systems', competencyMilestone: 'Assemble and pressure-test a DWV system' },
    { week: 'Week 6', title: 'Indiana Plumbing Code', competencyMilestone: 'Apply code requirements to fixture placement and venting' },
    { week: 'Week 7', title: 'Fixture Installation', competencyMilestone: 'Install toilet, sink, and shower to manufacturer specs' },
    { week: 'Week 8', title: 'Water Heaters & Backflow', competencyMilestone: 'Install water heater with proper venting and T&P relief' },
    { week: 'Week 9', title: 'OSHA 10 & Exam Prep', competencyMilestone: 'Complete OSHA 10-Hour course and practice exams' },
    { week: 'Week 10', title: 'Certification & Career Placement', competencyMilestone: 'Pass NCCER Core exam and complete career portfolio' },
  ],

  curriculum: [
    { title: 'Pipe Systems', topics: ['Copper soldering and brazing', 'PVC cement joints', 'PEX crimping and expansion', 'Cast iron and no-hub', 'Pipe sizing and layout'] },
    { title: 'DWV Systems', topics: ['Drain-waste-vent principles', 'Trap installation', 'Vent sizing and routing', 'Cleanout placement', 'Grade and slope'] },
    { title: 'Water Supply', topics: ['Water distribution systems', 'Pressure regulation', 'Water heater installation', 'Backflow prevention', 'Cross-connection control'] },
    { title: 'Fixtures', topics: ['Toilet installation', 'Sink and faucet installation', 'Bathtub and shower', 'Dishwasher and disposal', 'Washing machine hookup'] },
    { title: 'Safety & Code', topics: ['OSHA 10-Hour certification', 'Indiana Plumbing Code', 'Permit and inspection process', 'Excavation safety', 'Tool safety'] },
  ],

  complianceAlignment: [
    { standard: 'NCCER Standardized Curriculum', description: 'Core curriculum aligned to NCCER national standards.' },
    { standard: 'Indiana Plumbing Code', description: 'Training covers current Indiana plumbing code requirements.' },
    { standard: 'WIOA Title I', description: 'Program meets WIOA eligibility for Individual Training Accounts.' },
  ],

  trainingPhases: [
    { phase: 1, title: 'Fundamentals & Pipe Joining', weeks: 'Weeks 1–3', focus: 'Safety, tools, pipe materials, and joining methods.',
      labCompetencies: ['Solder copper pipe joints', 'Cement PVC connections', 'Crimp PEX fittings', 'Calculate pipe sizing'] },
    { phase: 2, title: 'Systems Installation', weeks: 'Weeks 4–6', focus: 'DWV systems, water supply, and plumbing code.',
      labCompetencies: ['Install and test DWV system', 'Install water supply piping to code', 'Apply Indiana Plumbing Code to layout'] },
    { phase: 3, title: 'Fixtures & Appliances', weeks: 'Weeks 7–8', focus: 'Fixture installation, water heaters, and backflow prevention.',
      labCompetencies: ['Install toilet, sink, and shower', 'Install water heater with T&P relief', 'Install backflow preventer'] },
    { phase: 4, title: 'Certification & Placement', weeks: 'Weeks 9–10', focus: 'OSHA 10, NCCER Core exam, and career placement.',
      labCompetencies: ['Pass OSHA 10-Hour course', 'Pass NCCER Core certification exam', 'Complete employer-ready portfolio'] },
  ],

  credentialPipeline: [
    { training: 'Plumbing Technician (10 weeks)', certification: 'OSHA 10-Hour Construction', certBody: 'U.S. Department of Labor', jobRole: 'Plumber Helper / Apprentice' },
    { training: 'NCCER Core Curriculum', certification: 'NCCER Core Certification', certBody: 'NCCER', jobRole: 'Construction Trades Entry' },
  ],

  laborMarket: { medianSalary: 59880, salaryRange: '$32,000–$75,000', growthRate: '2% (as fast as average)', source: 'U.S. Bureau of Labor Statistics', sourceYear: 2024, region: 'Indianapolis-Carmel-Anderson MSA' },
  careers: [
    { title: 'Plumber Helper', salary: '$32,000–$42,000' },
    { title: 'Plumbing Apprentice', salary: '$38,000–$50,000' },
    { title: 'Residential Plumber', salary: '$50,000–$70,000' },
    { title: 'Commercial Plumber', salary: '$55,000–$75,000' },
  ],

  cta: { applyHref: '/programs/plumbing/apply', advisorHref: '/contact', courseHref: '/programs/plumbing' },
  admissionRequirements: ['18 years or older', 'High school diploma or GED (or actively pursuing)', 'Able to lift 50 lbs', 'No prior plumbing experience required'],
  equipmentIncluded: 'All PPE, tools, training materials, and certification exam fees included',
  modality: 'Hybrid — In-person hands-on labs, LMS-supported theory, live instructor sessions',
  facilityInfo: 'Elevate training center, Indianapolis',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available.',
  employerPartners: ['Jesse J. Wilkerson & Associates — Architecture & Construction'],
  pricingIncludes: ['200 instructional hours', 'OSHA 10-Hour certification', 'NCCER Core Curriculum certification', 'CPR/First Aid certification', 'All PPE, tools, and materials', 'LMS access', 'Career placement support'],
  paymentTerms: 'WIOA, Next Level Jobs, and WRG funding accepted. Payment plans available for self-pay students.',

  faqs: [
    { question: 'Do I need plumbing experience?', answer: 'No. This program starts from the basics. You will learn pipe fitting, soldering, and system installation from scratch.' },
    { question: 'Will this make me a licensed plumber?', answer: 'This program prepares you for entry-level positions. Indiana requires supervised work experience for a journeyman plumber license. This gives you the foundation to start that path.' },
    { question: 'Is funding available?', answer: 'Yes. WIOA and Next Level Jobs funding covers tuition for eligible participants.' },
  ],

  breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Programs', href: '/programs' }, { label: 'Plumbing Technician' }],
  metaTitle: 'Plumbing Technician Training | OSHA 10 + NCCER | Indianapolis',
  metaDescription: 'Learn residential and commercial plumbing in 10 weeks. Earn OSHA 10 and NCCER certifications. Plumbers earn $59,880/year. WIOA funding available.',
};
