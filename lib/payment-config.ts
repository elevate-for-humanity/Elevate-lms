/**
 * Payment Configuration
 * Defines pricing for all programs
 * 
 * BARBER APPRENTICESHIP PROGRAM FEE: $4,980 (FLAT FEE)
 * 
 * IMPORTANT COMPLIANCE NOTICE:
 * - This is a DOL Registered Apprenticeship overlay program
 * - The fee is FLAT regardless of transferred hours
 * - Transferred hours reduce time-in-program ONLY, NOT the fee
 * - This program is NOT a barber school
 * - This program does NOT sell clock hours or licensure eligibility
 * 
 * THE $4,980 FEE COVERS:
 * - DOL Registered Apprenticeship sponsorship
 * - Compliance and RAPIDS reporting
 * - Employer (barbershop) coordination and OJT verification
 * - Program monitoring and completion documentation
 * - Related Instruction: Elevate LMS theory curriculum
 * - Indiana IPLA State Board Exam Fee ($50)
 * 
 * THE $4,980 FEE DOES NOT COVER:
 * - Practical hands-on barber skills training
 * - State licensure-required instructional hours
 * - Barber school enrollment
 */

// Indiana IPLA Exam Fees (included in program price)
export const IPLA_EXAM_FEES: Record<string, number> = {
  'barber-apprenticeship': 50,
  'cosmetology-apprenticeship': 50,
  'esthetician-apprenticeship': 50,
  'nail-technician-apprenticeship': 50,
};

// IPLA Exam URLs
export const IPLA_EXAM_INFO = {
  barber: {
    boardUrl: 'https://www.in.gov/pla/professions/barber-board/',
    examUrl: 'https://www.in.gov/pla/professions/barber-board/barber-examination/',
    applicationUrl: 'https://mylicense.in.gov/',
    examProvider: 'PSI Services',
    examProviderUrl: 'https://candidate.psiexams.com/',
  },
  cosmetology: {
    boardUrl: 'https://www.in.gov/pla/professions/cosmetology-board/',
    examUrl: 'https://www.in.gov/pla/professions/cosmetology-board/cosmetology-examination/',
    applicationUrl: 'https://mylicense.in.gov/',
    examProvider: 'PSI Services',
    examProviderUrl: 'https://candidate.psiexams.com/',
  },
  esthetician: {
    boardUrl: 'https://www.in.gov/pla/professions/cosmetology-board/',
    examUrl: 'https://www.in.gov/pla/professions/cosmetology-board/esthetician-examination/',
    applicationUrl: 'https://mylicense.in.gov/',
    examProvider: 'PSI Services',
    examProviderUrl: 'https://candidate.psiexams.com/',
  },
  nail: {
    boardUrl: 'https://www.in.gov/pla/professions/cosmetology-board/',
    examUrl: 'https://www.in.gov/pla/professions/cosmetology-board/manicurist-examination/',
    applicationUrl: 'https://mylicense.in.gov/',
    examProvider: 'PSI Services',
    examProviderUrl: 'https://candidate.psiexams.com/',
  },
};

export interface ProgramPaymentConfig {
  id: string;
  label: string;
  slug: string;
  price: number;
  isFlatFee: boolean;
  vendorName: string | null;
  vendorCost: number;
  description: string;
  features: string[];
  notIncluded: string[];
  disclaimer: string;
  paymentPlans?: {
    months: number;
    monthlyAmount: number;
    totalAmount: number;
    label: string;
  }[];
}

export const PROGRAM_PAYMENTS: ProgramPaymentConfig[] = [
  {
    id: 'barber',
    label: 'Registered Barber Apprenticeship',
    slug: 'barber-apprenticeship',
    price: 4980,
    isFlatFee: true,
    vendorName: 'none',
    vendorCost: 386,
    description: 'Registered Barber Apprenticeship Sponsorship, Oversight & Related Instruction (Elevate LMS Theory). This program provides federal apprenticeship sponsorship, employer coordination, compliance reporting, and related instruction. Practical skills training and licensure-required instructional hours are provided by a licensed barber school. This program does not grant barber licensure or clock hours toward state exams.',
    features: [
      'DOL Registered Apprenticeship sponsorship',
      'Compliance and RAPIDS reporting',
      'Employer (barbershop) coordination and OJT verification',
      'Program monitoring and completion documentation',
      'Related Instruction: Elevate LMS theory curriculum',
      'Indiana IPLA State Board Exam Fee included',
      'Indiana IPLA State Board Exam Fee included ($50)',
      'AI instructor support 24/7',
    ],
    notIncluded: [
      'Practical hands-on barber skills training',
      'State licensure-required instructional hours',
      'Barber school enrollment',
    ],
    disclaimer: '',
    paymentPlans: [
      { months: 1, monthlyAmount: 4980, totalAmount: 4980, label: 'Pay in Full' },
      { months: 4, monthlyAmount: 1245, totalAmount: 4980, label: '4-Month Plan' },
      { months: 6, monthlyAmount: 830, totalAmount: 4980, label: '6-Month Plan' },
      { months: 12, monthlyAmount: 415, totalAmount: 4980, label: '12-Month Plan' },
    ],
  },
  {
    id: 'nail-tech',
    label: 'Registered Nail Technician Apprenticeship',
    slug: 'nail-technician-apprenticeship',
    price: 2980,
    isFlatFee: true,
    vendorName: 'none',
    vendorCost: 200,
    description: 'Registered Nail Technician Apprenticeship Sponsorship, Oversight & Related Instruction (Elevate LMS Theory). This program provides federal apprenticeship sponsorship, employer coordination, compliance reporting, and related instruction. Practical skills training and licensure-required instructional hours are provided by a licensed nail technician school. This program does not grant nail technician licensure or clock hours toward state exams.',
    features: [
      'DOL Registered Apprenticeship sponsorship',
      'Compliance and RAPIDS reporting',
      'Employer (salon) coordination and OJT verification',
      'Program monitoring and completion documentation',
      'Related Instruction: Elevate LMS theory curriculum',
      'Indiana IPLA State Board Exam Fee included',
      'AI instructor support 24/7',
    ],
    notIncluded: [
      'Practical hands-on nail technician training',
      'State licensure-required instructional hours',
      'Nail technician school enrollment',
    ],
    disclaimer: '',
    paymentPlans: [
      { months: 1, monthlyAmount: 2980, totalAmount: 2980, label: 'Pay in Full' },
      { months: 4, monthlyAmount: 745, totalAmount: 2980, label: '4-Month Plan' },
      { months: 6, monthlyAmount: 497, totalAmount: 2980, label: '6-Month Plan' },
    ],
  },
  {
    id: 'esthetician',
    label: 'Registered Esthetician Apprenticeship',
    slug: 'esthetician-apprenticeship',
    price: 3480,
    isFlatFee: true,
    vendorName: 'none',
    vendorCost: 250,
    description: 'Registered Esthetician Apprenticeship Sponsorship, Oversight & Related Instruction (Elevate LMS Theory). This program provides federal apprenticeship sponsorship, employer coordination, compliance reporting, and related instruction. Practical skills training and licensure-required instructional hours are provided by a licensed esthetician school. This program does not grant esthetician licensure or clock hours toward state exams.',
    features: [
      'DOL Registered Apprenticeship sponsorship',
      'Compliance and RAPIDS reporting',
      'Employer (spa/salon) coordination and OJT verification',
      'Program monitoring and completion documentation',
      'Related Instruction: Elevate LMS theory curriculum',
      'Indiana IPLA State Board Exam Fee included',
      'AI instructor support 24/7',
    ],
    notIncluded: [
      'Practical hands-on esthetician training',
      'State licensure-required instructional hours',
      'Esthetician school enrollment',
    ],
    disclaimer: '',
    paymentPlans: [
      { months: 1, monthlyAmount: 3480, totalAmount: 3480, label: 'Pay in Full' },
      { months: 4, monthlyAmount: 870, totalAmount: 3480, label: '4-Month Plan' },
      { months: 6, monthlyAmount: 580, totalAmount: 3480, label: '6-Month Plan' },
    ],
  },
  {
    id: 'cosmetology',
    label: 'Registered Cosmetology Apprenticeship',
    slug: 'cosmetology-apprenticeship',
    price: 4980,
    isFlatFee: true,
    vendorName: 'none',
    vendorCost: 386,
    description: 'Registered Cosmetology Apprenticeship Sponsorship, Oversight & Related Instruction (Elevate LMS Theory). This program provides federal apprenticeship sponsorship, employer coordination, compliance reporting, and related instruction. Practical skills training and licensure-required instructional hours are provided by a licensed cosmetology school. This program does not grant cosmetology licensure or clock hours toward state exams.',
    features: [
      'DOL Registered Apprenticeship sponsorship',
      'Compliance and RAPIDS reporting',
      'Employer (salon) coordination and OJT verification',
      'Program monitoring and completion documentation',
      'Related Instruction: Elevate LMS theory curriculum',
      'Indiana IPLA State Board Exam Fee included',
      'AI instructor support 24/7',
    ],
    notIncluded: [
      'Practical hands-on cosmetology training',
      'State licensure-required instructional hours',
      'Cosmetology school enrollment',
    ],
    disclaimer: '',
    paymentPlans: [
      { months: 1, monthlyAmount: 4980, totalAmount: 4980, label: 'Pay in Full' },
      { months: 4, monthlyAmount: 1245, totalAmount: 4980, label: '4-Month Plan' },
      { months: 6, monthlyAmount: 830, totalAmount: 4980, label: '6-Month Plan' },
      { months: 12, monthlyAmount: 415, totalAmount: 4980, label: '12-Month Plan' },
    ],
  },
  {
    id: 'dsp',
    label: 'Direct Support Professional (DSP)',
    slug: 'direct-support-professional',
    price: 4325,
    isFlatFee: false,
    vendorName: null,
    vendorCost: 0,
    description: 'Become a certified Direct Support Professional',
    features: [
      'Complete DSP certification',
      'Job placement assistance',
      'AI instructor support 24/7',
    ],
    notIncluded: [],
    disclaimer: '',
  },
  {
    id: 'hvac',
    label: 'HVAC Technician',
    slug: 'hvac-technician',
    price: 5000,
    isFlatFee: false,
    vendorName: null,
    vendorCost: 0,
    description: 'HVAC installation and repair certification',
    features: [
      'EPA certification included',
      'Hands-on training',
      'Job placement assistance',
      'AI instructor support 24/7',
    ],
    notIncluded: [],
    disclaimer: '',
  },
  {
    id: 'cpr',
    label: 'CPR Certification',
    slug: 'cpr-certification',
    price: 575,
    isFlatFee: false,
    vendorName: null,
    vendorCost: 0,
    description: 'American Heart Association CPR certification',
    features: [
      'AHA CPR/AED certification',
      'Same-day certification',
      'Digital certificate',
    ],
    notIncluded: [],
    disclaimer: '',
  },
  {
    id: 'ehst',
    label: 'Emergency Health & Safety Tech',
    slug: 'emergency-health-safety',
    price: 4950,
    isFlatFee: false,
    vendorName: null,
    vendorCost: 0,
    description: 'Emergency medical and safety technician training',
    features: [
      'EMT-Basic certification prep',
      'Safety protocols training',
      'Job placement assistance',
      'AI instructor support 24/7',
    ],
    notIncluded: [],
    disclaimer: '',
  },
  {
    id: 'esth',
    label: 'Professional Esthetician',
    slug: 'professional-esthetician',
    price: 4575,
    isFlatFee: false,
    vendorName: null,
    vendorCost: 0,
    description: 'Licensed esthetician training and certification',
    features: [
      'State board exam preparation',
      'Hands-on training',
      'Business startup guidance',
      'AI instructor support 24/7',
    ],
    notIncluded: [],
    disclaimer: '',
  },
  {
    id: 'prc',
    label: 'Peer Recovery Coach',
    slug: 'peer-recovery-coach',
    price: 5000,
    isFlatFee: false,
    vendorName: null,
    vendorCost: 0,
    description: 'Certified peer recovery specialist training',
    features: [
      'State certification',
      'Trauma-informed care training',
      'Job placement assistance',
      'AI instructor support 24/7',
    ],
    notIncluded: [],
    disclaimer: '',
  },
  {
    id: 'tax',
    label: 'Tax Prep & Financial Services',
    slug: 'tax-prep-financial',
    price: 4950,
    isFlatFee: false,
    vendorName: null,
    vendorCost: 0,
    description: 'IRS-certified tax preparer training',
    features: [
      'IRS PTIN certification',
      'Tax software training',
      'Business startup guidance',
      'AI instructor support 24/7',
    ],
    notIncluded: [],
    disclaimer: '',
  },
  {
    id: 'biz',
    label: 'Business Startup & Marketing',
    slug: 'business-startup-marketing',
    price: 4550,
    isFlatFee: false,
    vendorName: null,
    vendorCost: 0,
    description: 'Launch and grow your business',
    features: [
      'Business plan development',
      'Digital marketing training',
      'LLC formation guidance',
      'AI instructor support 24/7',
    ],
    notIncluded: [],
    disclaimer: '',
  },
];

/**
 * Get payment configuration for a program
 */
export function getPaymentConfig(programSlug: string): ProgramPaymentConfig | null {
  return PROGRAM_PAYMENTS.find(p => p.slug === programSlug) || null;
}

/**
 * Calculate payment split for a program
 */
export function calculatePaymentSplit(programSlug: string, totalAmount: number) {
  const config = getPaymentConfig(programSlug);

  if (!config) {
    return {
      total: totalAmount,
      vendor: 0,
      elevate: totalAmount,
      vendorName: null,
    };
  }

  return {
    total: totalAmount,
    vendor: config.vendorCost,
    elevate: totalAmount - config.vendorCost,
    vendorName: config.vendorName,
  };
}
