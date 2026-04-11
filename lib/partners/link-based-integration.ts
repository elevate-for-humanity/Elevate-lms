// lib/partners/link-based-integration.ts
// Link-based partner integration — HSI and NRF/ServSafe only
//
// CareerSafe (OSHA) removed — no reseller authorization.
//
// PRICING: retailPrice = vendorCost × 1.50, rounded up to nearest dollar
// ServSafe Manager uses retailOverride $199 (from servsafe-programs.ts)
// WIOA-funded students pay $0 — self-pay students pay retailPrice

export interface PartnerCourse {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  vendorCost: number;
  retailPrice: number;
  stripePriceId: string;
  paymentLink: string;
  enrollmentUrl: string;
  loginUrl: string;
  supportUrl: string;
  certificationType: string;
  isActive: boolean;
}

export interface PartnerEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  partnerId: string;
  enrollmentUrl: string;
  status: 'pending' | 'enrolled' | 'active' | 'completed';
  enrolledAt?: Date;
  completedAt?: Date;
  certificateUrl?: string;
}

// HSI (Health & Safety Institute) — authorized reseller
export const HSI_COURSES: PartnerCourse[] = [
  {
    id: 'hsi-cpr-aed',
    partnerId: 'hsi',
    partnerName: 'Health & Safety Institute',
    title: 'CPR/AED Certification',
    description: 'American Heart Association CPR and AED certification training',
    category: 'Healthcare',
    duration: '4 hours',
    vendorCost: 18,
    retailPrice: 27,   // $18 × 1.5 = $27
    stripePriceId: 'price_1TL8hrH4a2yrVOt5ElYR7I96',
    paymentLink: 'https://buy.stripe.com/6oU6oHdzycjka8jbbzgIo0v',
    enrollmentUrl: 'https://www.hsi.com/courses/cpr-aed',
    loginUrl: 'https://www.hsi.com/login',
    supportUrl: 'https://www.hsi.com/support',
    certificationType: 'CPR/AED Certification',
    isActive: true,
  },
  {
    id: 'hsi-first-aid',
    partnerId: 'hsi',
    partnerName: 'Health & Safety Institute',
    title: 'First Aid Certification',
    description: 'Comprehensive first aid training and certification',
    category: 'Healthcare',
    duration: '4 hours',
    vendorCost: 18,
    retailPrice: 27,   // $18 × 1.5 = $27
    stripePriceId: 'price_1TL8hsH4a2yrVOt57ehb2iDo',
    paymentLink: 'https://buy.stripe.com/3cIeVd2UUersbcn5RfgIo0w',
    enrollmentUrl: 'https://www.hsi.com/courses/first-aid',
    loginUrl: 'https://www.hsi.com/login',
    supportUrl: 'https://www.hsi.com/support',
    certificationType: 'First Aid Certification',
    isActive: true,
  },
  {
    id: 'hsi-bloodborne-pathogens',
    partnerId: 'hsi',
    partnerName: 'Health & Safety Institute',
    title: 'Bloodborne Pathogens Training',
    description: 'OSHA-compliant bloodborne pathogens training',
    category: 'Healthcare',
    duration: '2 hours',
    vendorCost: 12,
    retailPrice: 18,   // $12 × 1.5 = $18
    stripePriceId: 'price_1TL8hsH4a2yrVOt56ipM5Rns',
    paymentLink: 'https://buy.stripe.com/8x2cN5eDC6Z02FR7ZngIo0x',
    enrollmentUrl: 'https://www.hsi.com/courses/bloodborne-pathogens',
    loginUrl: 'https://www.hsi.com/login',
    supportUrl: 'https://www.hsi.com/support',
    certificationType: 'Bloodborne Pathogens Certificate',
    isActive: true,
  },
];

// NRF (National Restaurant Foundation / ServSafe) — authorized training partner
// vendorCost from servsafe-programs.ts vendorBase
export const NRF_COURSES: PartnerCourse[] = [
  {
    id: 'nrf-servsafe-food-handler',
    partnerId: 'nrf',
    partnerName: 'National Restaurant Foundation',
    title: 'ServSafe Food Handler',
    description: 'Entry-level food safety certification',
    category: 'Food Service',
    duration: '2 hours',
    vendorCost: 13.50,
    retailPrice: 21,   // $13.50 × 1.5 = $20.25 → $21
    stripePriceId: 'price_1TL8htH4a2yrVOt5NIqzSJ30',
    paymentLink: 'https://buy.stripe.com/8x2aEXdzyfvw1BN4NbgIo0y',
    enrollmentUrl: 'https://www.servsafe.com/access/ss/Catalog/ProductDetails/SSFH7',
    loginUrl: 'https://www.servsafe.com/login',
    supportUrl: 'https://www.servsafe.com/support',
    certificationType: 'ServSafe Food Handler Certificate',
    isActive: true,
  },
  {
    id: 'nrf-servsafe-manager',
    partnerId: 'nrf',
    partnerName: 'National Restaurant Foundation',
    title: 'ServSafe Manager Certification',
    description: 'Food safety manager certification recognized nationwide',
    category: 'Food Service',
    duration: '16 hours',
    vendorCost: 137.66,
    retailPrice: 199,  // retailOverride from servsafe-programs.ts
    stripePriceId: 'price_1TL8huH4a2yrVOt59YVknndf',
    paymentLink: 'https://buy.stripe.com/28E7sLdzy6Z080bgvTgIo0z',
    enrollmentUrl: 'https://www.servsafe.com/access/ss/Catalog/ProductDetails/SSMC7',
    loginUrl: 'https://www.servsafe.com/login',
    supportUrl: 'https://www.servsafe.com/support',
    certificationType: 'ServSafe Manager Certificate',
    isActive: true,
  },
  {
    id: 'nrf-servsafe-alcohol',
    partnerId: 'nrf',
    partnerName: 'National Restaurant Foundation',
    title: 'ServSafe Alcohol Certification',
    description: 'Responsible alcohol service training',
    category: 'Food Service',
    duration: '4 hours',
    vendorCost: 20,
    retailPrice: 30,   // $20 × 1.5 = $30
    stripePriceId: 'price_1TL8XbH4a2yrVOt5XvDSzwsS',
    paymentLink: 'https://buy.stripe.com/cNidR9brq4QS2FR93rgIo0o',
    enrollmentUrl: 'https://www.servsafe.com/access/ss/Catalog/ProductDetails/SSA7',
    loginUrl: 'https://www.servsafe.com/login',
    supportUrl: 'https://www.servsafe.com/support',
    certificationType: 'ServSafe Alcohol Certificate',
    isActive: true,
  },
];

// JRI (Job Ready Indy) — grant-funded, no self-pay
export const JRI_COURSES: PartnerCourse[] = [
  {
    id: 'jri-work-ethic',
    partnerId: 'jri',
    partnerName: 'Job Ready Indy',
    title: 'Work Ethic & Professionalism',
    description: 'Essential workplace skills and professional development',
    category: 'Soft Skills',
    duration: '8 hours',
    vendorCost: 0,
    retailPrice: 0,
    stripePriceId: '',
    paymentLink: '',
    enrollmentUrl: 'https://employindy.tovutilms.com',
    loginUrl: 'https://employindy.tovutilms.com/login',
    supportUrl: 'https://employindy.org/contact',
    certificationType: 'JRI Work Readiness Certificate',
    isActive: true,
  },
  {
    id: 'jri-communication',
    partnerId: 'jri',
    partnerName: 'Job Ready Indy',
    title: 'Communication Skills',
    description: 'Professional communication and interpersonal skills',
    category: 'Soft Skills',
    duration: '6 hours',
    vendorCost: 0,
    retailPrice: 0,
    stripePriceId: '',
    paymentLink: '',
    enrollmentUrl: 'https://employindy.tovutilms.com',
    loginUrl: 'https://employindy.tovutilms.com/login',
    supportUrl: 'https://employindy.org/contact',
    certificationType: 'JRI Communication Certificate',
    isActive: true,
  },
  {
    id: 'jri-self-management',
    partnerId: 'jri',
    partnerName: 'Job Ready Indy',
    title: 'Self-Management & Goal Setting',
    description: 'Personal development and career planning',
    category: 'Soft Skills',
    duration: '6 hours',
    vendorCost: 0,
    retailPrice: 0,
    stripePriceId: '',
    paymentLink: '',
    enrollmentUrl: 'https://employindy.tovutilms.com',
    loginUrl: 'https://employindy.tovutilms.com/login',
    supportUrl: 'https://employindy.org/contact',
    certificationType: 'JRI Self-Management Certificate',
    isActive: true,
  },
];

// CareerSafe removed — no reseller authorization to sell OSHA courses

export const ALL_PARTNER_COURSES: PartnerCourse[] = [
  ...HSI_COURSES,
  ...NRF_COURSES,
  ...JRI_COURSES,
];

export function getPartnerCourses(partnerId: string): PartnerCourse[] {
  return ALL_PARTNER_COURSES.filter(c => c.partnerId === partnerId);
}

export function getCourseById(courseId: string): PartnerCourse | undefined {
  return ALL_PARTNER_COURSES.find(c => c.id === courseId);
}

export function getCoursesByCategory(category: string): PartnerCourse[] {
  return ALL_PARTNER_COURSES.filter(c => c.category === category);
}

export function getActiveCourses(): PartnerCourse[] {
  return ALL_PARTNER_COURSES.filter(c => c.isActive);
}

export function getPaidCourses(): PartnerCourse[] {
  return ALL_PARTNER_COURSES.filter(c => c.retailPrice > 0);
}

export function getPaymentLink(courseId: string, email?: string): string {
  const course = getCourseById(courseId);
  if (!course?.paymentLink) return '';
  return email
    ? `${course.paymentLink}?prefilled_email=${encodeURIComponent(email)}`
    : course.paymentLink;
}

export async function createPartnerEnrollment(
  studentId: string,
  courseId: string
): Promise<PartnerEnrollment> {
  const course = getCourseById(courseId);
  if (!course) throw new Error(`Course not found: ${courseId}`);
  return {
    id: `enroll_${Date.now()}`,
    studentId,
    courseId,
    partnerId: course.partnerId,
    enrollmentUrl: course.enrollmentUrl,
    status: 'pending',
  };
}

export function getEnrollmentInstructions(courseId: string): string {
  const course = getCourseById(courseId);
  if (!course) return 'Course not found';
  return `To access ${course.title}:\n\n1. Go to: ${course.enrollmentUrl}\n2. Create an account or log in at: ${course.loginUrl}\n3. Complete the course at your own pace\n4. Your certificate will be available upon completion\n5. Need help? Contact: ${course.supportUrl}`;
}
