import type { ProgramSchema } from '@/lib/programs/program-schema';

/**
 * Barber Apprenticeship — Program Detail Template v1
 * Indiana DOL Registered Apprenticeship
 * Hours math: 52 weeks × 15–20 hrs/week = 780–1040 hours
 * (Indiana requires 1,500 hours total: 1,000 OJT + 500 RTI — this covers the RTI portion)
 */
export const BARBER_APPRENTICESHIP: ProgramSchema = {
  slug: 'barber-apprenticeship',
  title: 'Barber Apprenticeship',
  subtitle: 'DOL Registered Apprenticeship in barbering. Complete 1,500 hours of training (1,000 OJT + 500 RTI) to earn your Indiana Barber License.',
  sector: 'personal-services',
  category: 'Personal Services',

  heroImage: '/images/pages/barber-hero-main.jpg',
  heroImageAlt: 'Barber apprentice cutting hair in a barbershop',

  deliveryMode: 'hybrid',
  durationWeeks: 52,
  hoursPerWeekMin: 15,
  hoursPerWeekMax: 20,
  hoursBreakdown: {
    onlineInstruction: 300,
    handsOnLab: 500,
    examPrep: 50,
    careerPlacement: 50,
  },
  schedule: 'Flexible — 15–20 hrs/week (OJT at host shop + RTI online)',
  cohortSize: '8–12 apprentices per cohort',
  fundingStatement: '$0 for apprentices. Employer-sponsored through DOL Registered Apprenticeship.',
  selfPayCost: '$3,500 (if not employer-sponsored)',
  badge: 'DOL Registered',
  badgeColor: 'blue',

  credentials: [
    {
      name: 'Indiana Barber License',
      issuer: 'Indiana State Board of Cosmetology and Barber Examiners',
      description: 'State license required to practice barbering in Indiana. Earned after completing 1,500 apprenticeship hours and passing the state exam.',
      validity: 'Renewable every 4 years',
    },
    {
      name: 'DOL Registered Apprenticeship Certificate',
      issuer: 'U.S. Department of Labor',
      description: 'National credential recognizing completion of a registered apprenticeship program. Portable across all 50 states.',
      validity: 'Lifetime',
    },
    {
      name: 'Barbershop Business Management Certificate',
      issuer: 'Elevate for Humanity',
      description: 'Business fundamentals for barbers: client management, booking systems, pricing strategy, and shop operations.',
    },
    {
      name: 'CPR / First Aid / AED',
      issuer: 'American Heart Association',
      description: 'Emergency response certification.',
      validity: '2 years',
    },
  ],

  outcomes: [
    { statement: 'Perform 6 standard haircut styles (fade, taper, buzz, scissor-over-comb, flat top, shape-up) to client satisfaction', assessedAt: 'Month 6' },
    { statement: 'Execute straight razor shaves following Indiana sanitation and safety protocols', assessedAt: 'Month 4' },
    { statement: 'Identify and treat 5 common scalp conditions using appropriate products', assessedAt: 'Month 3' },
    { statement: 'Demonstrate proper sanitation and disinfection procedures per Indiana Board standards', assessedAt: 'Month 1' },
    { statement: 'Complete 1,000 hours of on-the-job training at a licensed barbershop', assessedAt: 'Month 12' },
    { statement: 'Pass the Indiana Barber License written and practical exams', assessedAt: 'Month 12' },
    { statement: 'Build a client portfolio of 50+ documented services', assessedAt: 'Month 9' },
  ],

  careerPathway: [
    {
      title: 'Barber Apprentice',
      timeframe: '0–12 months (during program)',
      requirements: 'Enrolled in DOL Registered Apprenticeship',
      salaryRange: '$24,000–$30,000 (earn while you learn)',
    },
    {
      title: 'Licensed Barber',
      timeframe: '1–3 years',
      requirements: 'Indiana Barber License + 1,500 hours completed',
      salaryRange: '$30,000–$45,000',
    },
    {
      title: 'Senior Barber / Specialist',
      timeframe: '3–5 years',
      requirements: 'Established clientele + advanced techniques',
      salaryRange: '$45,000–$65,000',
    },
    {
      title: 'Shop Owner / Master Barber',
      timeframe: '5+ years',
      requirements: 'Business license + management experience',
      salaryRange: '$65,000–$100,000+',
    },
  ],

  weeklySchedule: [
    { week: 'Month 1–2', title: 'Foundations & Sanitation', competencyMilestone: 'Pass sanitation assessment, identify all tools, demonstrate proper disinfection procedures.' },
    { week: 'Month 3', title: 'Basic Cutting Techniques', competencyMilestone: 'Perform buzz cuts and basic tapers on mannequins, begin supervised client services.' },
    { week: 'Month 4', title: 'Shaving & Facial Hair', competencyMilestone: 'Execute straight razor shaves, shape beards and mustaches, demonstrate hot towel technique.' },
    { week: 'Month 5–6', title: 'Intermediate Cutting', competencyMilestone: 'Perform fades (low, mid, high), scissor-over-comb, and shape-ups to client satisfaction.' },
    { week: 'Month 7–8', title: 'Advanced Techniques', competencyMilestone: 'Hair design, texturizing, chemical services (relaxers, color). Build client portfolio to 25+ services.' },
    { week: 'Month 9–10', title: 'Business & Client Management', competencyMilestone: 'Manage booking system, build pricing strategy, reach 50+ documented client services.' },
    { week: 'Month 11', title: 'License Exam Prep', competencyMilestone: 'Pass practice written exam (80%+), complete practical exam rehearsals.' },
    { week: 'Month 12', title: 'Certification & Licensing', competencyMilestone: 'Take Indiana Barber License exam (written + practical), complete 1,500 total hours.' },
  ],

  curriculum: [
    {
      title: 'Barbering Foundations',
      topics: ['History and culture of barbering', 'Indiana Board of Cosmetology and Barber Examiners regulations', 'Sanitation, disinfection, and infection control', 'Tool identification and maintenance', 'Client consultation and communication'],
    },
    {
      title: 'Hair Cutting Techniques',
      topics: ['Clipper techniques: fades, tapers, buzz cuts', 'Scissor-over-comb and shear work', 'Shape-ups and edge work', 'Flat tops and specialty cuts', 'Hair texturizing and layering'],
    },
    {
      title: 'Shaving & Facial Hair',
      topics: ['Straight razor shaving technique and safety', 'Beard shaping and design', 'Hot towel preparation and application', 'Facial skin care and product knowledge', 'Mustache trimming and styling'],
    },
    {
      title: 'Scalp & Hair Science',
      topics: ['Hair and scalp anatomy', 'Common scalp conditions: dandruff, alopecia, folliculitis', 'Product selection by hair type', 'Chemical services: relaxers, color, treatments', 'Allergic reactions and contraindications'],
    },
    {
      title: 'Business Management',
      topics: ['Barbershop operations and workflow', 'Client booking and scheduling systems', 'Pricing strategy and service menus', 'Social media marketing for barbers', 'Financial basics: income tracking, taxes, tips'],
    },
    {
      title: 'License Exam Prep & Career Launch',
      topics: ['Indiana written exam review (laws, sanitation, theory)', 'Practical exam rehearsal (timed haircut + shave)', 'Portfolio documentation and presentation', 'Resume building and shop placement', 'Entrepreneurship: opening your own shop'],
    },
  ],

  complianceAlignment: [
    { standard: 'DOL Registered Apprenticeship', description: 'Program registered with the U.S. Department of Labor. Apprentices earn a nationally portable credential.' },
    { standard: 'Indiana IC 25-7', description: 'Training meets Indiana Code requirements for barber apprenticeship (1,500 hours: 1,000 OJT + 500 RTI).' },
    { standard: 'Indiana Board of Cosmetology and Barber Examiners', description: 'Curriculum aligned to state licensing exam content and sanitation standards.' },
    { standard: 'WIOA Title I', description: 'Apprenticeship eligible for WIOA supportive services and on-the-job training reimbursement.' },
    { standard: 'ETPL Listed', description: 'Eligible Training Provider List — approved for workforce board funding.' },
  ],

  trainingPhases: [
    {
      phase: 1,
      title: 'Foundations & Sanitation',
      weeks: 'Weeks 1–8',
      focus: 'Indiana barber law, sanitation/infection control, scalp and hair analysis, and tool proficiency.',
      labCompetencies: [
        'Sanitize and disinfect all tools per Indiana Board of Health standards',
        'Identify scalp conditions that require medical referral',
        'Demonstrate proper draping and client preparation',
        'Maintain a clean and organized workstation',
      ],
    },
    {
      phase: 2,
      title: 'Cutting & Styling Techniques',
      weeks: 'Weeks 9–26',
      focus: 'Clipper cuts, scissor cuts, fades, tapers, beard shaping, and styling.',
      labCompetencies: [
        'Perform a skin fade with seamless blending',
        'Execute scissor-over-comb technique on varied hair textures',
        'Shape and line a beard using straight razor and trimmers',
        'Complete a full men\'s haircut in under 30 minutes',
        'Perform a hot towel straight razor shave',
      ],
    },
    {
      phase: 3,
      title: 'Chemical Services & Advanced Skills',
      weeks: 'Weeks 27–40',
      focus: 'Chemical treatments, color services, hair replacement, and business fundamentals.',
      labCompetencies: [
        'Apply chemical relaxer with proper strand test and timing',
        'Perform a single-process color application',
        'Demonstrate hair replacement attachment techniques',
        'Calculate service pricing and product costs',
      ],
    },
    {
      phase: 4,
      title: 'Apprenticeship Hours & Exam Prep',
      weeks: 'Weeks 41–52',
      focus: 'Supervised shop floor hours, client management, and Indiana state board exam preparation.',
      labCompetencies: [
        'Complete 1,500 supervised apprenticeship hours',
        'Manage a personal client book of 20+ regular clients',
        'Pass practical exam simulation (4 required skills)',
        'Pass written exam practice test with 75%+ score',
      ],
    },
  ],

  credentialPipeline: [
    {
      training: 'Barber apprenticeship (52 weeks)',
      certification: 'Indiana Barber License',
      certBody: 'Indiana Professional Licensing Agency (SPLA)',
      jobRole: 'Licensed Barber',
    },
    {
      training: 'Sanitation/infection control (Weeks 1–8)',
      certification: 'Sanitation & Infection Control Certificate',
      certBody: 'Elevate for Humanity',
      jobRole: 'Barber / Personal Care Professional',
    },
    {
      training: 'Business fundamentals (Weeks 27–40)',
      certification: 'Barbershop Business Certificate',
      certBody: 'Elevate for Humanity',
      jobRole: 'Barbershop Manager / Owner',
    },
  ],

  laborMarket: {
    medianSalary: 35760,
    salaryRange: '$24,000–$65,000+',
    growthRate: '+5% (average)',
    source: 'U.S. Bureau of Labor Statistics, Occupational Outlook Handbook',
    sourceYear: 2024,
    region: 'Indiana',
  },
  careers: [
    { title: 'Licensed Barber', salary: '$30,000–$45,000' },
    { title: 'Senior Barber', salary: '$45,000–$65,000' },
    { title: 'Barbershop Manager', salary: '$50,000–$70,000' },
    { title: 'Shop Owner', salary: '$65,000–$100,000+' },
  ],

  cta: {
    applyHref: '/apply?program=barber-apprenticeship',
    advisorHref: '/contact',
  },

  admissionRequirements: [
    '16 years or older (Indiana minimum for barber apprentice)',
    'High school diploma or GED (or actively pursuing)',
    'Must be paired with a licensed host barbershop',
    'No prior barbering experience required',
  ],
  equipmentIncluded: 'Starter tool kit (clippers, shears, combs, cape), training materials, and license exam fees included',
  modality: 'Hybrid — Related Technical Instruction online via LMS, On-the-Job Training at licensed host barbershop',
  facilityInfo: 'Host barbershops across Indianapolis metro area',
  bilingualSupport: 'Bilingual (English/Spanish) instruction available.',
  employerPartners: [
    'Partner barbershops in Indianapolis (host shops)',
    'Indiana Barber Association',
  ],
  pricingIncludes: [
    '900 hours of training (52 weeks)',
    'Starter barber tool kit',
    'Indiana Barber License exam fee',
    'CPR/First Aid/AED certification',
    'LMS access for full program duration',
    'Career placement and shop matching',
  ],
  paymentTerms: 'Employer-sponsored through DOL Registered Apprenticeship. WIOA supportive services available. Self-pay option: $3,500 with payment plans.',

  faqs: [
    { question: 'Do I get paid during the apprenticeship?', answer: 'Yes. As a DOL Registered Apprentice, you earn wages while training at your host barbershop. Starting pay is typically $12–$15/hour, increasing as you gain skills.' },
    { question: 'How long is the program?', answer: '12 months (52 weeks). Indiana requires 1,500 total hours: 1,000 hours of on-the-job training at a licensed shop and 500 hours of Related Technical Instruction delivered online.' },
    { question: 'Do I need my own barbershop?', answer: 'No. We match you with a licensed host barbershop in the Indianapolis area. The host shop provides your on-the-job training environment.' },
    { question: 'What license do I earn?', answer: 'The Indiana Barber License, issued by the Indiana State Board of Cosmetology and Barber Examiners. You also earn a DOL Registered Apprenticeship certificate, which is recognized in all 50 states.' },
  ],

  breadcrumbs: [
    { label: 'Programs', href: '/programs' },
    { label: 'Personal Services', href: '/programs/personal-services' },
    { label: 'Barber Apprenticeship' },
  ],

  metaTitle: 'Barber Apprenticeship | DOL Registered | Indianapolis',
  metaDescription: '52-week DOL Registered Barber Apprenticeship. Earn your Indiana Barber License. 1,500 hours. Earn while you learn. WIOA funding available.',
};
