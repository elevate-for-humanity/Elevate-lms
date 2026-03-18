import type { ProgramSchema } from '@/lib/programs/program-schema';

export const DIESEL_MECHANIC: ProgramSchema = {
  slug: 'diesel-mechanic',
  title: 'Diesel Mechanic',
  subtitle: 'Diagnose and repair diesel engines, transmissions, and hydraulic systems. OSHA 10 and ASE prep in 12 weeks.',
  sector: 'skilled-trades',
  category: 'Diesel Technology',

  heroImage: '/images/pages/diesel-mechanic.jpg',
  heroImageAlt: 'Diesel mechanic student working on an engine',

  deliveryMode: 'hybrid',
  durationWeeks: 12,
  hoursPerWeekMin: 20,
  hoursPerWeekMax: 25,
  hoursBreakdown: { onlineInstruction: 40, handsOnLab: 160, examPrep: 20, careerPlacement: 20 },
  schedule: 'Mon–Fri, 8:00 AM–12:00 PM (20 hrs/week)',
  cohortSize: '10–12 participants per cohort',
  fundingStatement: 'WIOA and Next Level Jobs funding available for eligible Indiana residents. You must qualify — eligibility is not guaranteed. Self-pay options available.',
  selfPayCost: '$5,500',
  badge: 'Accepting Interest',
  badgeColor: 'orange',

  credentials: [
    { name: 'OSHA 10-Hour Construction Safety', issuer: 'U.S. Department of Labor', description: 'Construction safety certification covering hazard recognition.', validity: 'Recommended renewal every 5 years' },
    { name: 'ASE Medium/Heavy Truck Exam Prep', issuer: 'ASE (National Institute for Automotive Service Excellence)', description: 'Preparation for ASE T-series certification exams.', validity: 'Exam eligibility after qualifying work experience' },
    { name: 'CPR/AED/First Aid', issuer: 'American Heart Association', description: 'Emergency response certification.', validity: '2 years' },
  ],

  outcomes: [
    { statement: 'Diagnose diesel engine performance issues using scan tools and multimeters', assessedAt: 'Week 6' },
    { statement: 'Service and adjust diesel fuel injection systems', assessedAt: 'Week 5' },
    { statement: 'Inspect and repair air brake systems to FMCSA standards', assessedAt: 'Week 8' },
    { statement: 'Perform preventive maintenance on heavy-duty diesel vehicles', assessedAt: 'Week 3' },
    { statement: 'Read and interpret wiring diagrams for diesel electrical systems', assessedAt: 'Week 7' },
  ],

  careerPathway: [
    { title: 'Diesel Mechanic Helper', timeframe: '0–6 months', requirements: 'OSHA 10 + program completion', salaryRange: '$35,000–$45,000' },
    { title: 'Diesel Mechanic', timeframe: '1–3 years', requirements: 'ASE T-series certification', salaryRange: '$45,000–$65,000' },
    { title: 'Heavy Equipment Mechanic', timeframe: '2–4 years', requirements: 'ASE + heavy equipment experience', salaryRange: '$48,000–$68,000' },
    { title: 'Shop Foreman / Lead Tech', timeframe: '5+ years', requirements: 'Multiple ASE certs + leadership', salaryRange: '$60,000–$80,000' },
  ],

  weeklySchedule: [
    { week: 'Week 1', title: 'Shop Safety & Diesel Fundamentals', competencyMilestone: 'Identify diesel engine components and demonstrate shop safety' },
    { week: 'Week 2', title: 'Engine Theory & Operation', competencyMilestone: 'Explain four-stroke diesel cycle and compression ignition' },
    { week: 'Week 3', title: 'Preventive Maintenance', competencyMilestone: 'Perform complete PM inspection on a diesel vehicle' },
    { week: 'Week 4', title: 'Cooling & Lubrication Systems', competencyMilestone: 'Test and service cooling and lubrication systems' },
    { week: 'Week 5', title: 'Fuel Injection Systems', competencyMilestone: 'Service common rail fuel injection components' },
    { week: 'Week 6', title: 'Engine Diagnostics', competencyMilestone: 'Use scan tools to diagnose engine fault codes' },
    { week: 'Week 7', title: 'Electrical & Electronic Systems', competencyMilestone: 'Read wiring diagrams and test sensors with multimeter' },
    { week: 'Week 8', title: 'Air Brakes & ABS', competencyMilestone: 'Inspect and adjust air brake system components' },
    { week: 'Week 9', title: 'Drivetrain & Transmissions', competencyMilestone: 'Service manual transmission and drive axle components' },
    { week: 'Week 10', title: 'Hydraulic Systems', competencyMilestone: 'Test hydraulic pressure and diagnose leaks' },
    { week: 'Week 11', title: 'ASE Exam Prep', competencyMilestone: 'Score 80%+ on ASE T-series practice exams' },
    { week: 'Week 12', title: 'Certification & Career Placement', competencyMilestone: 'Complete OSHA 10 and career portfolio' },
  ],

  curriculum: [
    { title: 'Diesel Engines', topics: ['Engine theory and operation', 'Cylinder head and valve train', 'Piston and crankshaft assembly', 'Cooling and lubrication systems', 'Engine performance testing'] },
    { title: 'Fuel Systems', topics: ['Diesel fuel properties', 'Injection systems', 'Common rail systems', 'Fuel filters and water separators', 'Emissions controls'] },
    { title: 'Electrical Systems', topics: ['Starting and charging systems', 'Wiring diagrams', 'Sensor and actuator testing', 'Diagnostic scan tools', 'Multiplexing basics'] },
    { title: 'Drivetrain & Brakes', topics: ['Manual transmissions', 'Automatic transmissions', 'Drive axles and differentials', 'Air brake systems', 'ABS diagnostics'] },
    { title: 'Safety & Certification', topics: ['OSHA 10-Hour certification', 'Shop safety procedures', 'Hazardous materials handling', 'ASE exam preparation', 'Career placement support'] },
  ],

  complianceAlignment: [
    { standard: 'ASE Education Foundation', description: 'Curriculum aligned to ASE Medium/Heavy Truck certification standards.' },
    { standard: 'FMCSA Brake Standards', description: 'Air brake training meets Federal Motor Carrier Safety Administration requirements.' },
    { standard: 'WIOA Title I', description: 'Program meets WIOA eligibility for Individual Training Accounts.' },
  ],

  trainingPhases: [
    { phase: 1, title: 'Fundamentals & PM', weeks: 'Weeks 1–3', focus: 'Safety, engine theory, and preventive maintenance.',
      labCompetencies: ['Identify diesel engine components', 'Perform complete PM inspection', 'Service cooling and lubrication systems'] },
    { phase: 2, title: 'Engine Systems', weeks: 'Weeks 4–6', focus: 'Fuel injection, diagnostics, and engine performance.',
      labCompetencies: ['Service fuel injection components', 'Use scan tools for diagnostics', 'Interpret engine fault codes'] },
    { phase: 3, title: 'Chassis & Electrical', weeks: 'Weeks 7–10', focus: 'Electrical systems, brakes, drivetrain, and hydraulics.',
      labCompetencies: ['Test sensors with multimeter', 'Inspect and adjust air brakes', 'Diagnose hydraulic system issues'] },
    { phase: 4, title: 'Certification & Placement', weeks: 'Weeks 11–12', focus: 'ASE exam prep, OSHA 10, and career placement.',
      labCompetencies: ['Score 80%+ on ASE practice exams', 'Complete OSHA 10-Hour course', 'Complete employer-ready portfolio'] },
  ],

  credentialPipeline: [
    { training: 'Diesel Mechanic (12 weeks)', certification: 'OSHA 10-Hour Construction', certBody: 'U.S. Department of Labor', jobRole: 'Diesel Mechanic Helper' },
    { training: 'ASE Exam Prep', certification: 'ASE T-Series (after work experience)', certBody: 'National Institute for Automotive Service Excellence', jobRole: 'Certified Diesel Technician' },
  ],

  laborMarket: { medianSalary: 55000, salaryRange: '$35,000–$80,000', growthRate: '5% (faster than average)', source: 'U.S. Bureau of Labor Statistics', sourceYear: 2024, region: 'Indianapolis-Carmel-Anderson MSA' },
  careers: [
    { title: 'Diesel Mechanic', salary: '$45,000–$65,000' },
    { title: 'Heavy Equipment Mechanic', salary: '$48,000–$68,000' },
    { title: 'Fleet Maintenance Technician', salary: '$42,000–$60,000' },
    { title: 'Mobile Diesel Technician', salary: '$50,000–$70,000' },
  ],

  cta: { applyHref: '/inquiry?program=diesel-mechanic',
    requestInfoHref: '/programs/diesel-mechanic/request-info',
    careerConnectHref: 'https://www.indianacareerconnect.com/jobs/search?q=diesel+mechanic&location=Indiana', advisorHref: '/contact', courseHref: '/programs/diesel-mechanic' },
  admissionRequirements: ['18 years or older', 'High school diploma or GED', 'Able to lift 50 lbs', 'Basic mechanical aptitude helpful but not required'],
  equipmentIncluded: 'All tools, diagnostic equipment, PPE, and certification exam fees included',
  modality: 'Hybrid — Online theory via LMS, hands-on diesel shop at Elevate training facility',
  facilityInfo: 'Elevate training center, Indianapolis',
  employerPartners: ['Indianapolis-area trucking companies', 'Fleet maintenance operations', 'Heavy equipment dealers'],
  pricingIncludes: ['240 instructional hours', 'OSHA 10-Hour certification', 'ASE exam prep materials', 'CPR/First Aid certification', 'All tools and PPE', 'Career placement support'],
  paymentTerms: 'WIOA, Next Level Jobs, and WRG funding available for eligible Indiana residents — eligibility not guaranteed. Self-pay pricing available — contact us.',

  faqs: [
    { question: 'Do I need prior mechanic experience?', answer: 'No. This program starts with engine theory fundamentals and builds to advanced diagnostics.' },
    { question: 'What is ASE certification?', answer: 'ASE is the industry-standard certification for mechanics. This program prepares you for the ASE Medium/Heavy Truck exams. You can sit for the exams after gaining qualifying work experience.' },
    { question: 'Is this program WIOA-funded?', answer: 'Yes. Eligible participants can receive full funding through WIOA, covering tuition, materials, and certification fees.' },
  ],

  breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Programs', href: '/programs' }, { label: 'Diesel Mechanic' }],
  metaTitle: 'Diesel Mechanic Training | ASE Prep | Indianapolis',
  metaDescription: 'Diesel engine repair and maintenance training. 12-week program with OSHA 10 and ASE prep. Diesel mechanics earn $55,000/year. Indianapolis. WIOA funding available for eligible Indiana residents.',
};
