/**
 * Universal partner program configuration.
 * Each program defines its display info, required fields, and email content.
 * The partner application form, API route, landing page, and emails
 * all derive from this single config.
 */

export interface ProgramField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'radio' | 'number' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  helpText?: string;
}

export interface ProgramRequirement {
  title: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ProgramConfig {
  slug: string;
  name: string;
  shortName: string;
  heroImage: string;
  description: string;
  registeredApprenticeship: boolean;
  trainingHours: number;
  theoryProvider?: string;
  licensingBody?: string;
  licensingExam?: string;
  minimumWage: string;
  compensationModels: { value: string; label: string }[];
  supervisorTitle: string;
  supervisorLicenseRequired: boolean;
  workersCompRequired: boolean;
  siteVisitRequired: boolean;
  approvalTimeline: string;
  itinAccepted: boolean;
  /** Program-specific fields beyond the universal ones */
  programFields: ProgramField[];
  requirements: ProgramRequirement[];
  faq: FAQItem[];
  /** What to call the partner site (shop, facility, clinic, etc.) */
  siteLabel: string;
  siteLabelPlural: string;
  /** What to call the trainee */
  traineeLabel: string;
  traineeLabelPlural: string;
}

const COMPENSATION_MODELS_DEFAULT = [
  { value: 'hourly', label: 'Hourly Wage' },
  { value: 'commission', label: 'Commission' },
  { value: 'hybrid', label: 'Hybrid (Wage + Commission)' },
  { value: 'not_sure', label: 'Not Sure Yet' },
];

const COMPENSATION_MODELS_HOURLY_ONLY = [
  { value: 'hourly', label: 'Hourly Wage' },
  { value: 'salary', label: 'Salary' },
  { value: 'not_sure', label: 'Not Sure Yet' },
];

export const PROGRAM_CONFIGS: Record<string, ProgramConfig> = {
  'barbershop-apprenticeship': {
    slug: 'barbershop-apprenticeship',
    name: 'Indiana Barber Apprenticeship',
    shortName: 'Barber Apprenticeship',
    heroImage: '/images/pages/comp-cta-training.jpg',
    description: 'Host apprentices in your shop. Develop talent. Grow your team through Indiana\'s USDOL Registered Barber Apprenticeship.',
    registeredApprenticeship: true,
    trainingHours: 2000,
    theoryProvider: 'Milady RISE',
    licensingBody: 'Indiana Professional Licensing Agency (IPLA)',
    licensingExam: 'Indiana State Board barber license exam',
    minimumWage: '$7.25/hr',
    compensationModels: COMPENSATION_MODELS_DEFAULT,
    supervisorTitle: 'Supervising Barber',
    supervisorLicenseRequired: true,
    workersCompRequired: true,
    siteVisitRequired: true,
    approvalTimeline: '1 week',
    itinAccepted: true,
    siteLabel: 'shop',
    siteLabelPlural: 'shops',
    traineeLabel: 'apprentice',
    traineeLabelPlural: 'apprentices',
    programFields: [
      { name: 'indianaShopLicenseNumber', label: 'Indiana Shop License #', type: 'text', required: true, placeholder: 'e.g. SHP-12345' },
      { name: 'supervisorName', label: 'Supervising Barber Name', type: 'text', required: true },
      { name: 'supervisorLicenseNumber', label: 'Supervisor License #', type: 'text', required: true },
      { name: 'supervisorYearsLicensed', label: 'Years Licensed', type: 'number', required: false },
    ],
    requirements: [
      { title: 'Workers\' Compensation', description: 'Partner shops must carry workers\' comp insurance for apprentices. We can help you understand your options.' },
      { title: 'Pay Structure', description: 'Apprentices must be paid at least minimum wage ($7.25/hr). You choose the model — hourly, commission, or hybrid.' },
      { title: 'Supervising Barber', description: 'Designate a licensed barber to supervise apprentices and verify hours and competencies.' },
      { title: 'State Board & Licensing', description: 'Your shop must hold a valid Indiana shop license and be in good standing with the IPLA.' },
      { title: 'Tools & Kit', description: 'Apprentices are responsible for their own barber kit. Elevate provides a recommended list and can help with funding.' },
      { title: 'ITIN Accepted', description: 'Apprentices may use an ITIN in place of an SSN for enrollment.' },
      { title: 'Video Site Visit', description: 'A short Zoom site visit (~15 minutes) to confirm your shop meets program requirements.' },
      { title: 'DOL Listing', description: 'Approved shops are listed on the U.S. Department of Labor RAPIDS system.' },
    ],
    faq: [
      { question: 'How much does it cost to become a partner shop?', answer: 'There is no fee. You pay the apprentice a wage, and Elevate handles program administration, theory training, and DOL compliance.' },
      { question: 'Do I need workers\' comp insurance?', answer: 'Yes. Workers\' compensation insurance is required for all apprentices. We can help you understand your options.' },
      { question: 'How are apprentices paid?', answer: 'At least minimum wage ($7.25/hr). You choose hourly, commission, or hybrid.' },
      { question: 'What does the supervising barber do?', answer: 'Verifies hours and competencies, provides training guidance, and signs off on progress reports.' },
      { question: 'What is the video site visit?', answer: 'A 15-minute Zoom call to walk through your shop and confirm it meets requirements.' },
      { question: 'How long does the apprenticeship last?', answer: '2,000 hours of on-the-job training. About 1 year full-time.' },
      { question: 'Can apprentices use an ITIN?', answer: 'Yes. We accept ITIN in place of SSN for enrollment.' },
      { question: 'What happens after completion?', answer: 'Apprentices sit for the Indiana State Board barber license exam. Many shops hire them as licensed barbers.' },
      { question: 'Will my shop be listed publicly?', answer: 'Yes, on the U.S. Department of Labor RAPIDS system.' },
      { question: 'What do I need for my application?', answer: 'Shop license number, supervising barber license info, shop logo, and photos of inside/outside.' },
    ],
  },

  'cosmetology-apprenticeship': {
    slug: 'cosmetology-apprenticeship',
    name: 'Indiana Cosmetology Apprenticeship',
    shortName: 'Cosmetology Apprenticeship',
    heroImage: '/images/pages/comp-cta-training.jpg',
    description: 'Host cosmetology apprentices at your salon. Build your team through Indiana\'s USDOL Registered Cosmetology Apprenticeship.',
    registeredApprenticeship: true,
    trainingHours: 2100,
    theoryProvider: 'Milady RISE',
    licensingBody: 'Indiana Professional Licensing Agency (IPLA)',
    licensingExam: 'Indiana State Board cosmetology license exam',
    minimumWage: '$7.25/hr',
    compensationModels: COMPENSATION_MODELS_DEFAULT,
    supervisorTitle: 'Supervising Cosmetologist',
    supervisorLicenseRequired: true,
    workersCompRequired: true,
    siteVisitRequired: true,
    approvalTimeline: '1 week',
    itinAccepted: true,
    siteLabel: 'salon',
    siteLabelPlural: 'salons',
    traineeLabel: 'apprentice',
    traineeLabelPlural: 'apprentices',
    programFields: [
      { name: 'salonLicenseNumber', label: 'Indiana Salon License #', type: 'text', required: true },
      { name: 'supervisorName', label: 'Supervising Cosmetologist Name', type: 'text', required: true },
      { name: 'supervisorLicenseNumber', label: 'Supervisor License #', type: 'text', required: true },
      { name: 'supervisorYearsLicensed', label: 'Years Licensed', type: 'number', required: false },
    ],
    requirements: [
      { title: 'Workers\' Compensation', description: 'Partner salons must carry workers\' comp insurance for apprentices.' },
      { title: 'Pay Structure', description: 'Apprentices must be paid at least minimum wage ($7.25/hr).' },
      { title: 'Supervising Cosmetologist', description: 'Designate a licensed cosmetologist to supervise and verify hours.' },
      { title: 'State Board & Licensing', description: 'Your salon must hold a valid Indiana salon license.' },
      { title: 'Video Site Visit', description: 'A short Zoom visit (~15 minutes) to confirm your salon meets requirements.' },
      { title: 'DOL Listing', description: 'Approved salons are listed on the DOL RAPIDS system.' },
    ],
    faq: [
      { question: 'How much does it cost?', answer: 'No fee. You pay the apprentice a wage. Elevate handles administration and theory training.' },
      { question: 'How long is the program?', answer: '2,100 hours of on-the-job training. About 1 year full-time.' },
      { question: 'What license do I need?', answer: 'A valid Indiana salon license and a licensed cosmetologist to supervise.' },
    ],
  },

  'cna-clinical-partner': {
    slug: 'cna-clinical-partner',
    name: 'CNA Clinical Partner Program',
    shortName: 'CNA Clinical Partner',
    heroImage: '/images/pages/comp-cta-training.jpg',
    description: 'Host CNA students for clinical rotations at your healthcare facility. Help train the next generation of certified nursing assistants.',
    registeredApprenticeship: false,
    trainingHours: 75,
    theoryProvider: 'Elevate for Humanity',
    licensingBody: 'Indiana State Department of Health (ISDH)',
    licensingExam: 'Indiana CNA competency exam',
    minimumWage: 'N/A (clinical rotation)',
    compensationModels: COMPENSATION_MODELS_HOURLY_ONLY,
    supervisorTitle: 'Clinical Supervisor (RN/LPN)',
    supervisorLicenseRequired: true,
    workersCompRequired: true,
    siteVisitRequired: true,
    approvalTimeline: '1-2 weeks',
    itinAccepted: true,
    siteLabel: 'facility',
    siteLabelPlural: 'facilities',
    traineeLabel: 'student',
    traineeLabelPlural: 'students',
    programFields: [
      { name: 'facilityLicenseNumber', label: 'Facility License / NPI #', type: 'text', required: true },
      { name: 'facilityType', label: 'Facility Type', type: 'select', required: true, options: [
        { value: 'nursing_home', label: 'Nursing Home / SNF' },
        { value: 'hospital', label: 'Hospital' },
        { value: 'assisted_living', label: 'Assisted Living' },
        { value: 'home_health', label: 'Home Health Agency' },
        { value: 'other', label: 'Other' },
      ]},
      { name: 'supervisorName', label: 'Clinical Supervisor Name (RN/LPN)', type: 'text', required: true },
      { name: 'supervisorLicenseNumber', label: 'Supervisor License #', type: 'text', required: true },
      { name: 'maxStudentsPerRotation', label: 'Max Students Per Rotation', type: 'number', required: true },
    ],
    requirements: [
      { title: 'Licensed Facility', description: 'Must be a licensed healthcare facility in good standing with ISDH.' },
      { title: 'Clinical Supervisor', description: 'An RN or LPN must supervise students during clinical rotations.' },
      { title: 'Workers\' Compensation', description: 'Facility must carry workers\' comp or students must be covered under Elevate\'s policy.' },
      { title: 'Site Visit', description: 'A Zoom or in-person visit to confirm the facility meets clinical training requirements.' },
      { title: 'Student Capacity', description: 'Facility must accommodate at least 2 students per rotation.' },
    ],
    faq: [
      { question: 'How long are clinical rotations?', answer: '75 hours of supervised clinical training, typically over 2-3 weeks.' },
      { question: 'Do we pay the students?', answer: 'No. CNA clinical rotations are unpaid training hours. Students are not employees during rotations.' },
      { question: 'What supervision is required?', answer: 'A licensed RN or LPN must be on-site and directly supervising students during all clinical hours.' },
      { question: 'How many students per rotation?', answer: 'Typically 4-8 students depending on facility size and supervisor availability.' },
    ],
  },

  'hvac-apprenticeship': {
    slug: 'hvac-apprenticeship',
    name: 'HVAC Technician Apprenticeship',
    shortName: 'HVAC Apprenticeship',
    heroImage: '/images/pages/comp-cta-training.jpg',
    description: 'Host HVAC apprentices at your company. Train the next generation of HVAC technicians through structured on-the-job learning.',
    registeredApprenticeship: true,
    trainingHours: 2000,
    licensingBody: 'EPA (Section 608 Certification)',
    licensingExam: 'EPA 608 Universal Certification',
    minimumWage: '$12.00/hr',
    compensationModels: COMPENSATION_MODELS_HOURLY_ONLY,
    supervisorTitle: 'Journeyman HVAC Technician',
    supervisorLicenseRequired: true,
    workersCompRequired: true,
    siteVisitRequired: true,
    approvalTimeline: '1-2 weeks',
    itinAccepted: true,
    siteLabel: 'company',
    siteLabelPlural: 'companies',
    traineeLabel: 'apprentice',
    traineeLabelPlural: 'apprentices',
    programFields: [
      { name: 'contractorLicenseNumber', label: 'Contractor License #', type: 'text', required: true },
      { name: 'supervisorName', label: 'Journeyman Supervisor Name', type: 'text', required: true },
      { name: 'supervisorLicenseNumber', label: 'Supervisor EPA 608 Cert #', type: 'text', required: true },
      { name: 'supervisorYearsExperience', label: 'Years of Experience', type: 'number', required: false },
      { name: 'serviceTypes', label: 'Service Types', type: 'select', required: true, options: [
        { value: 'residential', label: 'Residential' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'both', label: 'Both Residential & Commercial' },
      ]},
    ],
    requirements: [
      { title: 'Licensed Contractor', description: 'Must hold a valid HVAC contractor license.' },
      { title: 'Workers\' Compensation', description: 'Must carry workers\' comp insurance for apprentices.' },
      { title: 'Pay Structure', description: 'Apprentices start at $12.00/hr minimum with scheduled increases.' },
      { title: 'Journeyman Supervisor', description: 'A journeyman HVAC technician with EPA 608 certification must supervise.' },
      { title: 'Safety Equipment', description: 'Company must provide required safety equipment and PPE.' },
      { title: 'Video Site Visit', description: 'A Zoom visit to confirm your operation meets program requirements.' },
    ],
    faq: [
      { question: 'How long is the apprenticeship?', answer: '2,000 hours of on-the-job training, about 1 year full-time.' },
      { question: 'What certifications do apprentices earn?', answer: 'EPA 608 Universal Certification upon completion.' },
      { question: 'What is the starting wage?', answer: '$12.00/hr minimum with scheduled increases as competencies are met.' },
    ],
  },

  'cdl-training-partner': {
    slug: 'cdl-training-partner',
    name: 'CDL Training Partner Program',
    shortName: 'CDL Training Partner',
    heroImage: '/images/pages/comp-cta-training.jpg',
    description: 'Partner with Elevate to provide CDL training and job placement. Host students for behind-the-wheel training at your fleet. Next cohort starts October 2026.',
    registeredApprenticeship: false,
    trainingHours: 160,
    licensingBody: 'FMCSA / Indiana BMV',
    licensingExam: 'CDL Class A or B skills test',
    minimumWage: 'N/A (training program)',
    compensationModels: COMPENSATION_MODELS_HOURLY_ONLY,
    supervisorTitle: 'CDL Instructor',
    supervisorLicenseRequired: true,
    workersCompRequired: true,
    siteVisitRequired: true,
    approvalTimeline: '1-2 weeks',
    itinAccepted: false,
    siteLabel: 'fleet',
    siteLabelPlural: 'fleets',
    traineeLabel: 'student',
    traineeLabelPlural: 'students',
    programFields: [
      { name: 'dotNumber', label: 'DOT Number', type: 'text', required: true },
      { name: 'mcNumber', label: 'MC Number (if applicable)', type: 'text', required: false },
      { name: 'fleetSize', label: 'Fleet Size', type: 'number', required: true },
      { name: 'supervisorName', label: 'CDL Instructor Name', type: 'text', required: true },
      { name: 'supervisorLicenseNumber', label: 'Instructor CDL #', type: 'text', required: true },
      { name: 'trainingType', label: 'Training Type', type: 'select', required: true, options: [
        { value: 'class_a', label: 'Class A CDL' },
        { value: 'class_b', label: 'Class B CDL' },
        { value: 'both', label: 'Both Class A & B' },
      ]},
    ],
    requirements: [
      { title: 'FMCSA Compliance', description: 'Must be registered with FMCSA and have a satisfactory safety rating.' },
      { title: 'Insurance', description: 'Must carry commercial auto liability and workers\' comp insurance.' },
      { title: 'CDL Instructor', description: 'A licensed CDL holder with clean driving record must supervise all behind-the-wheel training.' },
      { title: 'Training Vehicles', description: 'Must provide properly maintained training vehicles with dual controls.' },
      { title: 'Site Visit', description: 'A visit to inspect training vehicles and facilities.' },
    ],
    faq: [
      { question: 'When does the next cohort start?', answer: 'The next CDL cohort starts in October 2026. Join the waitlist to reserve your spot.' },
      { question: 'How long is CDL training?', answer: '160 hours total — classroom, range, and behind-the-wheel.' },
      { question: 'Do we pay the students?', answer: 'Not during training. Some partners offer paid apprenticeships after licensing.' },
      { question: 'What do we need to provide?', answer: 'Training vehicles with dual controls, a licensed instructor, and a safe training area.' },
    ],
  },

  'welding-apprenticeship': {
    slug: 'welding-apprenticeship',
    name: 'Welding Apprenticeship',
    shortName: 'Welding Apprenticeship',
    heroImage: '/images/pages/comp-cta-training.jpg',
    description: 'Host welding apprentices at your shop or fabrication facility. Train skilled welders through structured on-the-job learning.',
    registeredApprenticeship: true,
    trainingHours: 2000,
    licensingBody: 'AWS (American Welding Society)',
    licensingExam: 'AWS Certified Welder exam',
    minimumWage: '$12.00/hr',
    compensationModels: COMPENSATION_MODELS_HOURLY_ONLY,
    supervisorTitle: 'Journeyman Welder',
    supervisorLicenseRequired: true,
    workersCompRequired: true,
    siteVisitRequired: true,
    approvalTimeline: '1-2 weeks',
    itinAccepted: true,
    siteLabel: 'shop',
    siteLabelPlural: 'shops',
    traineeLabel: 'apprentice',
    traineeLabelPlural: 'apprentices',
    programFields: [
      { name: 'supervisorName', label: 'Journeyman Welder Name', type: 'text', required: true },
      { name: 'supervisorCertNumber', label: 'AWS Certification #', type: 'text', required: true },
      { name: 'supervisorYearsExperience', label: 'Years of Experience', type: 'number', required: false },
      { name: 'weldingProcesses', label: 'Welding Processes Offered', type: 'select', required: true, options: [
        { value: 'mig', label: 'MIG (GMAW)' },
        { value: 'tig', label: 'TIG (GTAW)' },
        { value: 'stick', label: 'Stick (SMAW)' },
        { value: 'multi', label: 'Multiple Processes' },
      ]},
    ],
    requirements: [
      { title: 'Workers\' Compensation', description: 'Must carry workers\' comp insurance for apprentices.' },
      { title: 'Pay Structure', description: 'Apprentices start at $12.00/hr minimum.' },
      { title: 'Certified Supervisor', description: 'An AWS-certified welder must supervise apprentices.' },
      { title: 'Safety Equipment', description: 'Must provide welding PPE and maintain OSHA-compliant workspace.' },
      { title: 'Video Site Visit', description: 'A Zoom visit to confirm your shop meets safety and training requirements.' },
    ],
    faq: [
      { question: 'How long is the apprenticeship?', answer: '2,000 hours, about 1 year full-time.' },
      { question: 'What certifications do apprentices earn?', answer: 'AWS Certified Welder credential.' },
      { question: 'What safety requirements are there?', answer: 'OSHA-compliant workspace, proper ventilation, and all required PPE provided.' },
    ],
  },

  'electrical-apprenticeship': {
    slug: 'electrical-apprenticeship',
    name: 'Electrical Apprenticeship',
    shortName: 'Electrical Apprenticeship',
    heroImage: '/images/pages/comp-cta-training.jpg',
    description: 'Host electrical apprentices at your company. Train licensed electricians through structured on-the-job learning.',
    registeredApprenticeship: true,
    trainingHours: 8000,
    licensingBody: 'Indiana Fire Prevention and Building Safety Commission',
    licensingExam: 'Indiana Journeyman Electrician exam',
    minimumWage: '$14.00/hr',
    compensationModels: COMPENSATION_MODELS_HOURLY_ONLY,
    supervisorTitle: 'Journeyman Electrician',
    supervisorLicenseRequired: true,
    workersCompRequired: true,
    siteVisitRequired: true,
    approvalTimeline: '1-2 weeks',
    itinAccepted: true,
    siteLabel: 'company',
    siteLabelPlural: 'companies',
    traineeLabel: 'apprentice',
    traineeLabelPlural: 'apprentices',
    programFields: [
      { name: 'contractorLicenseNumber', label: 'Electrical Contractor License #', type: 'text', required: true },
      { name: 'supervisorName', label: 'Journeyman Electrician Name', type: 'text', required: true },
      { name: 'supervisorLicenseNumber', label: 'Journeyman License #', type: 'text', required: true },
      { name: 'supervisorYearsExperience', label: 'Years of Experience', type: 'number', required: false },
      { name: 'workType', label: 'Primary Work Type', type: 'select', required: true, options: [
        { value: 'residential', label: 'Residential' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'industrial', label: 'Industrial' },
        { value: 'multi', label: 'Multiple Types' },
      ]},
    ],
    requirements: [
      { title: 'Licensed Contractor', description: 'Must hold a valid Indiana electrical contractor license.' },
      { title: 'Workers\' Compensation', description: 'Must carry workers\' comp insurance.' },
      { title: 'Pay Structure', description: 'Apprentices start at $14.00/hr minimum with scheduled increases.' },
      { title: 'Journeyman Supervisor', description: 'A licensed journeyman electrician must supervise all apprentice work.' },
      { title: 'Safety Compliance', description: 'Must maintain OSHA-compliant worksite and provide required PPE.' },
    ],
    faq: [
      { question: 'How long is the apprenticeship?', answer: '8,000 hours (about 4 years) of on-the-job training plus related instruction.' },
      { question: 'What license do apprentices earn?', answer: 'Indiana Journeyman Electrician license upon completion and passing the exam.' },
      { question: 'What is the starting wage?', answer: '$14.00/hr minimum with increases as competencies are met.' },
    ],
  },

  'plumbing-apprenticeship': {
    slug: 'plumbing-apprenticeship',
    name: 'Plumbing Apprenticeship',
    shortName: 'Plumbing Apprenticeship',
    heroImage: '/images/pages/comp-pathway-trades.jpg',
    description: 'Host plumbing apprentices at your company. Train licensed plumbers through structured on-the-job learning.',
    registeredApprenticeship: true,
    trainingHours: 8000,
    licensingBody: 'Indiana Fire Prevention and Building Safety Commission',
    licensingExam: 'Indiana Journeyman Plumber exam',
    minimumWage: '$14.00/hr',
    compensationModels: COMPENSATION_MODELS_HOURLY_ONLY,
    supervisorTitle: 'Journeyman Plumber',
    supervisorLicenseRequired: true,
    workersCompRequired: true,
    siteVisitRequired: true,
    approvalTimeline: '1-2 weeks',
    itinAccepted: true,
    siteLabel: 'company',
    siteLabelPlural: 'companies',
    traineeLabel: 'apprentice',
    traineeLabelPlural: 'apprentices',
    programFields: [
      { name: 'contractorLicenseNumber', label: 'Plumbing Contractor License #', type: 'text', required: true },
      { name: 'supervisorName', label: 'Journeyman Plumber Name', type: 'text', required: true },
      { name: 'supervisorLicenseNumber', label: 'Journeyman License #', type: 'text', required: true },
      { name: 'supervisorYearsExperience', label: 'Years of Experience', type: 'number', required: false },
    ],
    requirements: [
      { title: 'Licensed Contractor', description: 'Must hold a valid Indiana plumbing contractor license.' },
      { title: 'Workers\' Compensation', description: 'Must carry workers\' comp insurance.' },
      { title: 'Pay Structure', description: 'Apprentices start at $14.00/hr minimum with scheduled increases.' },
      { title: 'Journeyman Supervisor', description: 'A licensed journeyman plumber must supervise all apprentice work.' },
      { title: 'Safety Compliance', description: 'Must maintain OSHA-compliant worksite.' },
    ],
    faq: [
      { question: 'How long is the apprenticeship?', answer: '8,000 hours (about 4 years) of on-the-job training plus related instruction.' },
      { question: 'What license do apprentices earn?', answer: 'Indiana Journeyman Plumber license.' },
      { question: 'What is the starting wage?', answer: '$14.00/hr minimum with increases as competencies are met.' },
    ],
  },
};

/** Get config by slug, returns undefined if not found */
export function getProgramConfig(slug: string): ProgramConfig | undefined {
  return PROGRAM_CONFIGS[slug];
}

/** Get all program slugs */
export function getAllProgramSlugs(): string[] {
  return Object.keys(PROGRAM_CONFIGS);
}

/** Get all programs as array for listing */
export function getAllPrograms(): ProgramConfig[] {
  return Object.values(PROGRAM_CONFIGS);
}
