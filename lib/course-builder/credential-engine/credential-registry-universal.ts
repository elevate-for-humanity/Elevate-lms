/**
 * Universal Credential Registry
 * 
 * Complete registry of ALL credentials supported by Elevate LMS.
 * Organized by category and sub-category.
 */

export type CredentialCategory =
  | 'healthcare'
  | 'trades'
  | 'beauty'
  | 'workforce'
  | 'technology'
  | 'food'
  | 'transportation'
  | 'business'
  | 'safety'
  | 'government'
  | 'employer';

export type CredentialType =
  | 'certification'      // Industry certification (NHA, EPA, etc.)
  | 'licensure'         // State license (barber, cosmetology)
  | 'apprenticeship'    // DOL registered apprenticeship
  | 'continuing-ed'     // CE credits
  | 'assessment'         // WorkKeys, etc.
  | 'employer'          // Company-specific
  | 'internal';         // Internal SOP/training

export interface ExamSection {
  name: string;
  questions: number;
  passingScore: number;
  topics: string[];
  domainWeight?: number;  // Percentage of exam
}

export interface ComplianceRequirement {
  type: 'state' | 'federal' | 'wioa' | 'dol' | 'accreditation';
  states?: string[];      // Applicable states
  requirements: string[];
}

export interface RenewalRequirement {
  type: 'hours' | 'exam' | 'both' | 'none';
  hours?: number;
  frequency?: string;
  notes?: string;
}

export interface CredentialDefinition {
  id: string;
  slug: string;
  name: string;
  provider: string;
  category: CredentialCategory;
  subCategory?: string;
  type: CredentialType;
  description: string;
  
  // Exam details
  examSections: ExamSection[];
  totalQuestions: number;
  passingScore: number;
  examFormat: string;
  examFrequency?: string;
  retakePolicy: string;
  
  // Validity
  validityPeriod?: string;
  renewalRequirement?: RenewalRequirement;
  
  // Prerequisites
  prerequisites?: string[];
  minimumAge?: number;
  educationRequirement?: string;
  experienceRequirement?: string;
  
  // Costs
  examFee?: string;
  studyMaterialsFee?: string;
  
  // Compliance
  compliance?: ComplianceRequirement[];
  
  // O*NET mapping
  sosCodes?: string[];
  careerPathway?: string;
  
  // Integration
  availableOnElevate: boolean;
  courseSlug?: string;
  referenceDocuments?: string[];
  blueprintSlug?: string;
  
  // Related credentials
  relatedCredentials?: string[];
  successorCredential?: string;
  prerequisiteCredential?: string;
}

export const UNIVERSAL_CREDENTIAL_REGISTRY: Record<string, CredentialDefinition> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTHCARE - NHA CERTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  'nha-ccma': {
    id: 'nha-ccma',
    slug: 'nha-ccma',
    name: 'Certified Clinical Medical Assistant (CCMA)',
    provider: 'National Healthcareer Association (NHA)',
    category: 'healthcare',
    subCategory: 'NHA',
    type: 'certification',
    description: 'National certification for clinical medical assistants',
    examSections: [
      { name: 'Foundations', questions: 25, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Clinical Patient Care', questions: 55, passingScore: 70, topics: [], domainWeight: 55 },
      { name: 'General Wishbone', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions, 2 hours, computer-based',
    retakePolicy: 'After 30 days',
    validityPeriod: '2 years',
    renewalRequirement: { type: 'both', hours: 10 },
    sosCodes: ['31-9092.00'],
    careerPathway: 'Medical Assistant → Medical Office Manager',
    availableOnElevate: true,
    courseSlug: 'medical-assistant',
  },

  'nha-cpt': {
    id: 'nha-cpt',
    slug: 'nha-cpt',
    name: 'Certified Phlebotomy Technician (CPT)',
    provider: 'National Healthcareer Association (NHA)',
    category: 'healthcare',
    subCategory: 'NHA',
    type: 'certification',
    description: 'National certification for phlebotomy technicians',
    examSections: [
      { name: 'Collection', questions: 59, passingScore: 70, topics: [], domainWeight: 59 },
      { name: 'Procedures', questions: 29, passingScore: 70, topics: [], domainWeight: 29 },
      { name: 'Safety', questions: 12, passingScore: 70, topics: [], domainWeight: 12 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions, 1 hour 50 minutes',
    retakePolicy: 'After 14 days',
    validityPeriod: '2 years',
    renewalRequirement: { type: 'both', hours: 6 },
    sosCodes: ['31-9097.00'],
    careerPathway: 'Phlebotomist → Lab Supervisor',
    availableOnElevate: true,
    courseSlug: 'phlebotomy',
  },

  'nha-ekg': {
    id: 'nha-ekg',
    slug: 'nha-ekg',
    name: 'Certified EKG Technician (CET)',
    provider: 'National Healthcareer Association (NHA)',
    category: 'healthcare',
    subCategory: 'NHA',
    type: 'certification',
    description: 'National certification for EKG technicians',
    examSections: [
      { name: 'EKG Fundamentals', questions: 30, passingScore: 70, topics: [], domainWeight: 30 },
      { name: 'EKG Procedures', questions: 45, passingScore: 70, topics: [], domainWeight: 45 },
      { name: 'Patient Care', questions: 25, passingScore: 70, topics: [], domainWeight: 25 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions, 2 hours',
    retakePolicy: 'After 14 days',
    validityPeriod: '2 years',
    renewalRequirement: { type: 'both', hours: 4 },
    sosCodes: ['29-2031.00'],
    careerPathway: 'EKG Tech → Cardiac Monitor Tech',
    availableOnElevate: true,
    courseSlug: 'ekg',
  },

  'nha-excpt': {
    id: 'nha-excpt',
    slug: 'nha-excpt',
    name: 'ExCPT - Certified Pharmacy Technician',
    provider: 'National Healthcareer Association (NHA)',
    category: 'healthcare',
    subCategory: 'NHA',
    type: 'certification',
    description: 'National certification for pharmacy technicians',
    examSections: [
      { name: 'Dispensing', questions: 40, passingScore: 70, topics: [], domainWeight: 40 },
      { name: 'Pharmacology', questions: 25, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Medication Safety', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
      { name: 'Regulations', questions: 15, passingScore: 70, topics: [], domainWeight: 15 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions, 2 hours',
    retakePolicy: 'After 30 days',
    validityPeriod: '2 years',
    renewalRequirement: { type: 'both', hours: 20 },
    sosCodes: ['29-2052.00'],
    careerPathway: 'Pharmacy Tech → Lead Pharmacy Tech → Pharmacist',
    availableOnElevate: true,
    courseSlug: 'pharmacy-technician',
  },

  'nha-cbcs': {
    id: 'nha-cbcs',
    slug: 'nha-cbcs',
    name: 'Certified Billing and Coding Specialist (CBCS)',
    provider: 'National Healthcareer Association (NHA)',
    category: 'healthcare',
    subCategory: 'NHA',
    type: 'certification',
    description: 'National certification for medical billing and coding',
    examSections: [
      { name: 'Revenue Cycle', questions: 35, passingScore: 70, topics: [], domainWeight: 35 },
      { name: 'Claims Processing', questions: 30, passingScore: 70, topics: [], domainWeight: 30 },
      { name: 'Compliance', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
      { name: 'Coding', questions: 15, passingScore: 70, topics: [], domainWeight: 15 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions, 2 hours',
    retakePolicy: 'After 30 days',
    validityPeriod: '2 years',
    renewalRequirement: { type: 'both', hours: 10 },
    sosCodes: ['29-2071.00'],
    careerPathway: 'Billing/Coding → Revenue Cycle Manager',
    availableOnElevate: true,
    courseSlug: 'medical-billing-coding',
  },

  'nha-cmaa': {
    id: 'nha-cmaa',
    slug: 'nha-cmaa',
    name: 'Certified Medical Administrative Assistant (CMAA)',
    provider: 'National Healthcareer Association (NHA)',
    category: 'healthcare',
    subCategory: 'NHA',
    type: 'certification',
    description: 'National certification for medical administrative assistants',
    examSections: [
      { name: 'Office Management', questions: 40, passingScore: 70, topics: [], domainWeight: 40 },
      { name: 'Patient Interactions', questions: 30, passingScore: 70, topics: [], domainWeight: 30 },
      { name: 'Scheduling', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
      { name: 'Compliance', questions: 10, passingScore: 70, topics: [], domainWeight: 10 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions, 1 hour 50 minutes',
    retakePolicy: 'After 14 days',
    validityPeriod: '2 years',
    renewalRequirement: { type: 'both', hours: 10 },
    sosCodes: ['43-6013.00'],
    careerPathway: 'Medical Admin → Office Manager → Practice Manager',
    availableOnElevate: true,
    courseSlug: 'medical-admin',
  },

  'nha-cehrs': {
    id: 'nha-cehrs',
    slug: 'nha-cehrs',
    name: 'Certified Electronic Health Records Specialist (CEHRS)',
    provider: 'National Healthcareer Association (NHA)',
    category: 'healthcare',
    subCategory: 'NHA',
    type: 'certification',
    description: 'National certification for EHR specialists',
    examSections: [
      { name: 'EHR Fundamentals', questions: 35, passingScore: 70, topics: [], domainWeight: 35 },
      { name: 'Health Records', questions: 30, passingScore: 70, topics: [], domainWeight: 30 },
      { name: 'Workflow', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
      { name: 'Privacy & Security', questions: 15, passingScore: 70, topics: [], domainWeight: 15 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions, 1 hour 50 minutes',
    retakePolicy: 'After 14 days',
    validityPeriod: '2 years',
    renewalRequirement: { type: 'both', hours: 10 },
    sosCodes: ['29-2071.00'],
    careerPathway: 'EHR Specialist → Health IT Coordinator',
    availableOnElevate: true,
    courseSlug: 'ehr',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTHCARE - CNA / STATE LICENSE
  // ═══════════════════════════════════════════════════════════════════════════
  'indiana-cna': {
    id: 'indiana-cna',
    slug: 'indiana-cna',
    name: 'Certified Nursing Assistant (CNA) - Indiana',
    provider: 'Indiana State Department of Health',
    category: 'healthcare',
    subCategory: 'State License',
    type: 'licensure',
    description: 'Indiana state certification for nursing assistants',
    examSections: [
      { name: 'Written Exam', questions: 75, passingScore: 70, topics: [], domainWeight: 75 },
      { name: 'Skills Exam', questions: 5, passingScore: 70, topics: [], domainWeight: 25 },
    ],
    totalQuestions: 75,
    passingScore: 70,
    examFormat: '75 written questions + 5 skill demonstrations',
    retakePolicy: 'After 90 days (3 attempts)',
    validityPeriod: '2 years',
    renewalRequirement: { type: 'both', hours: 24, frequency: '2 years' },
    minimumAge: 18,
    educationRequirement: '75-hour state-approved training program',
    sosCodes: ['31-1131.00'],
    careerPathway: 'CNA → LPN → RN',
    availableOnElevate: true,
    courseSlug: 'cna',
    compliance: [
      { type: 'state', states: ['IN'], requirements: ['75-hour training', 'Federal mandate compliance'] }
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADES - HVAC / REFRIGERATION
  // ═══════════════════════════════════════════════════════════════════════════
  'epa-608-universal': {
    id: 'epa-608-universal',
    slug: 'epa-608-universal',
    name: 'EPA 608 Universal Technician Certification',
    provider: 'ESCO Institute / Mainstream Engineering',
    category: 'trades',
    subCategory: 'HVAC/R',
    type: 'certification',
    description: 'EPA Section 608 certification for all refrigerant types',
    examSections: [
      { name: 'Core', questions: 25, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Type I', questions: 25, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Type II', questions: 25, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Type III', questions: 25, passingScore: 70, topics: [], domainWeight: 25 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions, closed book, PT chart allowed',
    retakePolicy: 'Retake failed sections immediately',
    validityPeriod: 'Lifetime',
    renewalRequirement: { type: 'none' },
    sosCodes: ['49-9021.00'],
    careerPathway: 'HVAC Tech → Lead Tech → Service Manager',
    availableOnElevate: true,
    courseSlug: 'hvac',
    compliance: [
      { type: 'federal', requirements: ['Clean Air Act Section 608', 'Montreal Protocol'] }
    ],
  },

  'epa-608-core': {
    id: 'epa-608-core',
    slug: 'epa-608-core',
    name: 'EPA 608 Core Certification',
    provider: 'ESCO Institute',
    category: 'trades',
    subCategory: 'HVAC/R',
    type: 'certification',
    description: 'EPA Section 608 Core certification only',
    examSections: [
      { name: 'Core', questions: 25, passingScore: 70, topics: [], domainWeight: 100 },
    ],
    totalQuestions: 25,
    passingScore: 70,
    examFormat: '25 questions, closed book',
    retakePolicy: 'Retake immediately',
    validityPeriod: 'Lifetime',
    renewalRequirement: { type: 'none' },
    sosCodes: ['49-9021.00'],
    availableOnElevate: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADES - NCCER
  // ═══════════════════════════════════════════════════════════════════════════
  'nccer-core': {
    id: 'nccer-core',
    slug: 'nccer-core',
    name: 'NCCER Core Curriculum',
    provider: 'NCCER',
    category: 'trades',
    subCategory: 'NCCER',
    type: 'certification',
    description: 'Introductory craft skills for all construction trades',
    examSections: [
      { name: 'Basic Safety', questions: 0, passingScore: 70, topics: [], domainWeight: 20 },
      { name: 'Construction Math', questions: 0, passingScore: 70, topics: [], domainWeight: 15 },
      { name: 'Hand Tools', questions: 0, passingScore: 70, topics: [], domainWeight: 15 },
      { name: 'Power Tools', questions: 0, passingScore: 70, topics: [], domainWeight: 15 },
      { name: 'Construction Drawings', questions: 0, passingScore: 70, topics: [], domainWeight: 15 },
      { name: 'Basic Rigging', questions: 0, passingScore: 70, topics: [], domainWeight: 20 },
    ],
    totalQuestions: 0,
    passingScore: 70,
    examFormat: 'Module assessments + written exam',
    retakePolicy: 'Per module',
    validityPeriod: 'Lifetime',
    renewalRequirement: { type: 'none' },
    sosCodes: ['47-2061.00'],
    careerPathway: 'Construction Helper → Craftsperson',
    availableOnElevate: false,
    prerequisites: ['OSHA 10 recommended'],
  },

  'nccer-hvac': {
    id: 'nccer-hvac',
    slug: 'nccer-hvac',
    name: 'NCCER HVAC Level 1-4',
    provider: 'NCCER',
    category: 'trades',
    subCategory: 'NCCER',
    type: 'certification',
    description: 'NCCER HVAC/R craft certification (4 levels)',
    examSections: [
      { name: 'Level 1', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 2', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 3', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 4', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
    ],
    totalQuestions: 0,
    passingScore: 70,
    examFormat: 'Module exams + performance profiles',
    retakePolicy: 'Per module',
    validityPeriod: 'Lifetime',
    renewalRequirement: { type: 'none' },
    sosCodes: ['49-9021.00'],
    availableOnElevate: false,
    prerequisites: ['NCCER Core', 'EPA 608'],
  },

  'nccer-electrical': {
    id: 'nccer-electrical',
    slug: 'nccer-electrical',
    name: 'NCCER Electrical Level 1-4',
    provider: 'NCCER',
    category: 'trades',
    subCategory: 'NCCER',
    type: 'certification',
    description: 'NCCER Electrical craft certification (4 levels)',
    examSections: [
      { name: 'Level 1', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 2', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 3', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 4', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
    ],
    totalQuestions: 0,
    passingScore: 70,
    examFormat: 'Module exams + performance profiles',
    retakePolicy: 'Per module',
    validityPeriod: 'Lifetime',
    renewalRequirement: { type: 'none' },
    sosCodes: ['47-2111.00'],
    availableOnElevate: false,
  },

  'nccer-plumbing': {
    id: 'nccer-plumbing',
    slug: 'nccer-plumbing',
    name: 'NCCER Plumbing Level 1-4',
    provider: 'NCCER',
    category: 'trades',
    subCategory: 'NCCER',
    type: 'certification',
    description: 'NCCER Plumbing craft certification (4 levels)',
    examSections: [
      { name: 'Level 1', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 2', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 3', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 4', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
    ],
    totalQuestions: 0,
    passingScore: 70,
    examFormat: 'Module exams + performance profiles',
    retakePolicy: 'Per module',
    validityPeriod: 'Lifetime',
    renewalRequirement: { type: 'none' },
    sosCodes: ['47-2152.00'],
    availableOnElevate: false,
  },

  'nccer-welding': {
    id: 'nccer-welding',
    slug: 'nccer-welding',
    name: 'NCCER Welding Level 1-4',
    provider: 'NCCER',
    category: 'trades',
    subCategory: 'NCCER',
    type: 'certification',
    description: 'NCCER Welding craft certification (4 levels)',
    examSections: [
      { name: 'Level 1', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 2', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 3', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Level 4', questions: 0, passingScore: 70, topics: [], domainWeight: 25 },
    ],
    totalQuestions: 0,
    passingScore: 70,
    examFormat: 'Module exams + performance profiles',
    retakePolicy: 'Per module',
    validityPeriod: 'Lifetime',
    renewalRequirement: { type: 'none' },
    sosCodes: ['51-4121.00'],
    availableOnElevate: false,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BEAUTY - BARBER
  // ═══════════════════════════════════════════════════════════════════════════
  'indiana-barber': {
    id: 'indiana-barber',
    slug: 'indiana-barber',
    name: 'Indiana Barber License',
    provider: 'Indiana State Board of Cosmetology and Barbering',
    category: 'beauty',
    subCategory: 'State License',
    type: 'licensure',
    description: 'Indiana barber examination for state licensure',
    examSections: [
      { name: 'Infection Control', questions: 30, passingScore: 70, topics: [], domainWeight: 30 },
      { name: 'Hair Care', questions: 30, passingScore: 70, topics: [], domainWeight: 30 },
      { name: 'Shaving', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
      { name: 'State Rules', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions + practical exam',
    retakePolicy: 'After 30 days',
    validityPeriod: '4 years',
    renewalRequirement: { type: 'both', hours: 8, frequency: '4 years' },
    minimumAge: 18,
    educationRequirement: '1,500-hour barber school program',
    sosCodes: ['39-5011.00'],
    careerPathway: 'Barber → Master Barber → Shop Owner',
    availableOnElevate: true,
    courseSlug: 'barber-apprenticeship',
    compliance: [
      { type: 'state', states: ['IN'], requirements: ['Indiana Administrative Code 844 IAC', 'Barber Board regulations'] }
    ],
  },

  'indiana-barber-apprenticeship': {
    id: 'indiana-barber-apprenticeship',
    slug: 'indiana-barber-apprenticeship',
    name: 'Indiana Registered Barber Apprenticeship',
    provider: 'DOL-registered program / Indiana Barber Board',
    category: 'beauty',
    subCategory: 'Registered Apprenticeship',
    type: 'apprenticeship',
    description: 'DOL-registered barber apprenticeship in Indiana',
    examSections: [
      { name: 'Related Technical Instruction', questions: 0, passingScore: 100, topics: [], domainWeight: 0 },
      { name: 'On-The-Job Training', questions: 0, passingScore: 100, topics: [], domainWeight: 0 },
    ],
    totalQuestions: 0,
    passingScore: 70,
    examFormat: 'Competency demonstrations + state board exam',
    retakePolicy: 'N/A',
    validityPeriod: 'Until completion + license',
    prerequisites: ['16 years old', 'High school diploma/GED'],
    sosCodes: ['39-5011.00'],
    careerPathway: 'Apprentice → Barber → Master Barber → Shop Owner',
    availableOnElevate: true,
    courseSlug: 'barber-apprenticeship',
    compliance: [
      { type: 'dol', requirements: ['DOL registered apprenticeship standards', 'RTI + OJL structure'] },
      { type: 'state', states: ['IN'], requirements: ['Indiana Barber Board approved'] }
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BEAUTY - COSMETOLOGY
  // ═══════════════════════════════════════════════════════════════════════════
  'indiana-cosmetology': {
    id: 'indiana-cosmetology',
    slug: 'indiana-cosmetology',
    name: 'Indiana Cosmetology License',
    provider: 'Indiana State Board of Cosmetology and Barbering',
    category: 'beauty',
    subCategory: 'State License',
    type: 'licensure',
    description: 'Indiana cosmetology examination for state licensure',
    examSections: [
      { name: 'Infection Control', questions: 25, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Hair Care', questions: 25, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Nails', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
      { name: 'Skin Care', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
      { name: 'State Rules', questions: 10, passingScore: 70, topics: [], domainWeight: 10 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions + practical exam',
    retakePolicy: 'After 30 days',
    validityPeriod: '4 years',
    renewalRequirement: { type: 'both', hours: 8, frequency: '4 years' },
    minimumAge: 18,
    educationRequirement: '1,500-hour cosmetology school program',
    sosCodes: ['39-5012.00'],
    careerPathway: 'Stylist → Senior Stylist → Salon Owner',
    availableOnElevate: true,
    courseSlug: 'cosmetology',
    compliance: [
      { type: 'state', states: ['IN'], requirements: ['Indiana Administrative Code 844 IAC'] }
    ],
  },

  'indiana-esthetics': {
    id: 'indiana-esthetics',
    slug: 'indiana-esthetics',
    name: 'Indiana Esthetics License',
    provider: 'Indiana State Board of Cosmetology and Barbering',
    category: 'beauty',
    subCategory: 'State License',
    type: 'licensure',
    description: 'Indiana esthetics examination for skin care licensure',
    examSections: [
      { name: 'Infection Control', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
      { name: 'Skin Care', questions: 40, passingScore: 70, topics: [], domainWeight: 40 },
      { name: 'Chemical Peels', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
      { name: 'State Rules', questions: 20, passingScore: 70, topics: [], domainWeight: 20 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions + practical exam',
    retakePolicy: 'After 30 days',
    validityPeriod: '4 years',
    renewalRequirement: { type: 'both', hours: 8, frequency: '4 years' },
    minimumAge: 18,
    educationRequirement: '700-hour esthetics program',
    sosCodes: ['39-5094.00'],
    careerPathway: 'Esthetician → Lead Esthetician → Med Spa Owner',
    availableOnElevate: true,
    courseSlug: 'esthetics',
    compliance: [
      { type: 'state', states: ['IN'], requirements: ['Indiana Administrative Code 844 IAC'] }
    ],
  },

  'indiana-nails': {
    id: 'indiana-nails',
    slug: 'indiana-nails',
    name: 'Indiana Nail Technician License',
    provider: 'Indiana State Board of Cosmetology and Barbering',
    category: 'beauty',
    subCategory: 'State License',
    type: 'licensure',
    description: 'Indiana nail technician examination for licensure',
    examSections: [
      { name: 'Infection Control', questions: 25, passingScore: 70, topics: [], domainWeight: 25 },
      { name: 'Nail Care', questions: 50, passingScore: 70, topics: [], domainWeight: 50 },
      { name: 'State Rules', questions: 25, passingScore: 70, topics: [], domainWeight: 25 },
    ],
    totalQuestions: 100,
    passingScore: 70,
    examFormat: '100 questions + practical exam',
    retakePolicy: 'After 30 days',
    validityPeriod: '4 years',
    renewalRequirement: { type: 'both', hours: 8, frequency: '4 years' },
    minimumAge: 18,
    educationRequirement: '600-hour nail technician program',
    sosCodes: ['39-5092.00'],
    careerPathway: 'Nail Tech → Senior Nail Tech → Salon Owner',
    availableOnElevate: true,
    courseSlug: 'nail-technician',
    compliance: [
      { type: 'state', states: ['IN'], requirements: ['Indiana Administrative Code 844 IAC'] }
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFORCE - SAFETY
  // ═══════════════════════════════════════════════════════════════════════════
  'osha-10': {
    id: 'osha-10',
    slug: 'osha-10',
    name: 'OSHA 10-Hour General Industry',
    provider: 'OSHA Training Institute (OTI)',
    category: 'safety',
    subCategory: 'OSHA',
    type: 'certification',
    description: '10-hour general industry safety certification',
    examSections: [
      { name: 'Mandatory Topics', questions: 0, passingScore: 100, topics: [], domainWeight: 40 },
      { name: 'Elective Topics', questions: 0, passingScore: 100, topics: [], domainWeight: 50 },
      { name: 'Optional Topics', questions: 0, passingScore: 100, topics: [], domainWeight: 10 },
    ],
    totalQuestions: 0,
    passingScore: 100,
    examFormat: 'No written exam - attendance required',
    retakePolicy: 'N/A',
    validityPeriod: 'Lifetime',
    renewalRequirement: { type: 'none' },
    sosCodes: ['47-2061.00', '49-9021.00', '31-9092.00'],
    careerPathway: 'Entry-level safety awareness',
    availableOnElevate: true,
    courseSlug: 'osha-10',
    compliance: [
      { type: 'federal', requirements: ['OSHA regulations 29 CFR 1910'] },
      { type: 'wioa', requirements: ['Approved for WIOA funding'] }
    ],
  },

  'osha-30': {
    id: 'osha-30',
    slug: 'osha-30',
    name: 'OSHA 30-Hour General Industry',
    provider: 'OSHA Training Institute (OTI)',
    category: 'safety',
    subCategory: 'OSHA',
    type: 'certification',
    description: '30-hour general industry safety certification (supervisor level)',
    examSections: [
      { name: 'Mandatory Topics', questions: 0, passingScore: 100, topics: [], domainWeight: 30 },
      { name: 'Elective Topics', questions: 0, passingScore: 100, topics: [], domainWeight: 60 },
      { name: 'Optional Topics', questions: 0, passingScore: 100, topics: [], domainWeight: 10 },
    ],
    totalQuestions: 0,
    passingScore: 100,
    examFormat: 'No written exam - attendance required',
    retakePolicy: 'N/A',
    validityPeriod: 'Lifetime',
    renewalRequirement: { type: 'none' },
    sosCodes: ['47-2061.00', '49-9021.00'],
    careerPathway: 'Supervisor/Manager safety training',
    availableOnElevate: true,
    courseSlug: 'osha-30',
    compliance: [
      { type: 'federal', requirements: ['OSHA regulations 29 CFR 1910'] }
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFORCE - CPR / FIRST AID
  // ═══════════════════════════════════════════════════════════════════════════
  'cpr-aed': {
    id: 'cpr-aed',
    slug: 'cpr-aed',
    name: 'CPR/AED Certification',
    provider: 'American Heart Association / American Red Cross',
    category: 'healthcare',
    subCategory: 'Emergency Care',
    type: 'certification',
    description: 'CPR and AED certification for workplace safety',
    examSections: [
      { name: 'Written Exam', questions: 10, passingScore: 80, topics: [], domainWeight: 100 },
    ],
    totalQuestions: 10,
    passingScore: 80,
    examFormat: 'Written exam + skills demonstration',
    retakePolicy: 'Immediately for skills, 24 hours for written',
    validityPeriod: '2 years',
    renewalRequirement: { type: 'exam', frequency: '2 years' },
    sosCodes: ['31-9092.00', '29-2041.00'],
    availableOnElevate: true,
    courseSlug: 'cpr-aed',
    compliance: [
      { type: 'federal', requirements: ['OSHA 1910.151'] }
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFORCE - FOOD SAFETY
  // ═══════════════════════════════════════════════════════════════════════════
  'servsafe': {
    id: 'servsafe',
    slug: 'servsafe',
    name: 'ServSafe Food Protection Manager',
    provider: 'National Restaurant Association',
    category: 'food',
    subCategory: 'Food Safety',
    type: 'certification',
    description: 'Food safety manager certification',
    examSections: [
      { name: 'Food Safety', questions: 80, passingScore: 75, topics: [], domainWeight: 100 },
    ],
    totalQuestions: 80,
    passingScore: 75,
    examFormat: '80 questions, 2 hours',
    retakePolicy: 'After 30 days',
    validityPeriod: '5 years',
    renewalRequirement: { type: 'exam', frequency: '5 years' },
    sosCodes: ['11-9051.00'],
    careerPathway: 'Food Handler → ServSafe Manager → Food Service Director',
    availableOnElevate: true,
    courseSlug: 'servsafe',
    compliance: [
      { type: 'state', states: ['IN', 'OH', 'KY'], requirements: ['Indiana requires for food service managers'] }
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKFORCE - ASSESSMENT
  // ═══════════════════════════════════════════════════════════════════════════
  'act-workkeys': {
    id: 'act-workkeys',
    slug: 'act-workkeys',
    name: 'ACT WorkKeys Applied Mathematics',
    provider: 'ACT',
    category: 'workforce',
    subCategory: 'Assessment',
    type: 'assessment',
    description: 'WorkKeys applied math assessment for employment',
    examSections: [
      { name: 'Applied Mathematics', questions: 0, passingScore: 0, topics: [], domainWeight: 100 },
    ],
    totalQuestions: 0,
    passingScore: 0,
    examFormat: 'Computer-based assessment',
    retakePolicy: 'After 60 days',
    validityPeriod: '2 years',
    sosCodes: ['11-9199.00'],
    careerPathway: 'Employment readiness credential',
    availableOnElevate: true,
    courseSlug: 'workkeys',
    compliance: [
      { type: 'wioa', requirements: ['Approved for WIOA funding'] }
    ],
  },

  'careersafe-osha': {
    id: 'careersafe-osha',
    slug: 'careersafe-osha',
    name: 'CareerSafe OSHA 10-Hour',
    provider: 'CareerSafe',
    category: 'safety',
    subCategory: 'OSHA',
    type: 'certification',
    description: 'Online OSHA 10-hour certification for youth',
    examSections: [
      { name: 'Final Assessment', questions: 0, passingScore: 70, topics: [], domainWeight: 100 },
    ],
    totalQuestions: 0,
    passingScore: 70,
    examFormat: 'Online assessment + attendance',
    retakePolicy: 'After 30 days',
    validityPeriod: 'Lifetime',
    renewalRequirement: { type: 'none' },
    availableOnElevate: true,
    courseSlug: 'careersafe',
    compliance: [
      { type: 'federal', requirements: ['OSHA regulations'] },
      { type: 'wioa', requirements: ['WIOA eligible'] }
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSPORTATION - CDL
  // ═══════════════════════════════════════════════════════════════════════════
  'cdl-permit': {
    id: 'cdl-permit',
    slug: 'cdl-permit',
    name: 'CDL Learner Permit (Indiana)',
    provider: 'Indiana BMV',
    category: 'transportation',
    subCategory: 'Commercial Driver',
    type: 'licensure',
    description: 'Commercial driver license learner permit',
    examSections: [
      { name: 'General Knowledge', questions: 50, passingScore: 80, topics: [], domainWeight: 100 },
    ],
    totalQuestions: 50,
    passingScore: 80,
    examFormat: 'Computer-based written exam',
    retakePolicy: 'After 14 days',
    validityPeriod: '1 year',
    minimumAge: 21,
    educationRequirement: 'Must pass written exam + road test',
    sosCodes: ['53-3031.00'],
    careerPathway: 'CDL-A Driver → Lead Driver → Fleet Manager',
    availableOnElevate: true,
    courseSlug: 'cdl',
    compliance: [
      { type: 'federal', requirements: ['FMCSA regulations'] },
      { type: 'state', states: ['IN'], requirements: ['Indiana BMV'] }
    ],
  },

  'forklift': {
    id: 'forklift',
    slug: 'forklift',
    name: 'Forklift Operator Certification',
    provider: 'OSHA / Employer',
    category: 'safety',
    subCategory: 'Equipment',
    type: 'certification',
    description: 'OSHA-required forklift operator certification',
    examSections: [
      { name: 'Written Exam', questions: 0, passingScore: 70, topics: [], domainWeight: 50 },
      { name: 'Practical Test', questions: 0, passingScore: 100, topics: [], domainWeight: 50 },
    ],
    totalQuestions: 0,
    passingScore: 70,
    examFormat: 'Written + practical evaluation',
    retakePolicy: 'Per employer',
    validityPeriod: '3 years',
    renewalRequirement: { type: 'both', frequency: '3 years' },
    sosCodes: ['53-7051.00'],
    careerPathway: 'Warehouse Associate → Forklift Operator → Supervisor',
    availableOnElevate: true,
    courseSlug: 'forklift',
    compliance: [
      { type: 'federal', requirements: ['OSHA 1910.178'] }
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get credential by slug
 */
export function getCredential(slug: string): CredentialDefinition | undefined {
  return UNIVERSAL_CREDENTIAL_REGISTRY[slug];
}

/**
 * Get all credentials by category
 */
export function getCredentialsByCategory(category: CredentialCategory): CredentialDefinition[] {
  return Object.values(UNIVERSAL_CREDENTIAL_REGISTRY).filter(c => c.category === category);
}

/**
 * Get credentials by type
 */
export function getCredentialsByType(type: CredentialType): CredentialDefinition[] {
  return Object.values(UNIVERSAL_CREDENTIAL_REGISTRY).filter(c => c.type === type);
}

/**
 * Get all available credentials on Elevate
 */
export function getAvailableCredentials(): CredentialDefinition[] {
  return Object.values(UNIVERSAL_CREDENTIAL_REGISTRY).filter(c => c.availableOnElevate);
}

/**
 * Search credentials by keyword
 */
export function searchCredentials(query: string): CredentialDefinition[] {
  const lower = query.toLowerCase();
  return Object.values(UNIVERSAL_CREDENTIAL_REGISTRY).filter(c =>
    c.name.toLowerCase().includes(lower) ||
    c.slug.toLowerCase().includes(lower) ||
    c.provider.toLowerCase().includes(lower) ||
    c.description.toLowerCase().includes(lower) ||
    c.category.toLowerCase().includes(lower)
  );
}

/**
 * Get credentials by state compliance
 */
export function getCredentialsForState(state: string): CredentialDefinition[] {
  return Object.values(UNIVERSAL_CREDENTIAL_REGISTRY).filter(c =>
    c.compliance?.some(req => 
      req.type === 'state' && req.states?.includes(state)
    )
  );
}

/**
 * Get credentials by SOC code
 */
export function getCredentialsForSOC(socCode: string): CredentialDefinition[] {
  return Object.values(UNIVERSAL_CREDENTIAL_REGISTRY).filter(c =>
    c.sosCodes?.includes(socCode)
  );
}

/**
 * Get all categories with counts
 */
export function getCategorySummary(): Record<CredentialCategory, number> {
  const summary = {} as Record<CredentialCategory, number>;
  for (const cred of Object.values(UNIVERSAL_CREDENTIAL_REGISTRY)) {
    summary[cred.category] = (summary[cred.category] || 0) + 1;
  }
  return summary;
}

/**
 * Get all credential slugs
 */
export function getAllCredentialSlugs(): string[] {
  return Object.keys(UNIVERSAL_CREDENTIAL_REGISTRY);
}

/**
 * Get credential pathway (next steps)
 */
export function getCareerPathway(credentialSlug: string): CredentialDefinition[] {
  const pathway: CredentialDefinition[] = [];
  
  // Add current
  const current = getCredential(credentialSlug);
  if (current) pathway.push(current);
  
  // Add successor if exists
  if (current?.successorCredential) {
    const successor = getCredential(current.successorCredential);
    if (successor) pathway.push(successor);
  }
  
  return pathway;
}
