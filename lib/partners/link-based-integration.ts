// lib/partners/link-based-integration.ts
// Link-based partner integration system (no API keys needed)
// Partners: HSI, NRF, JRI, CareerSafe
//
// PRICING POLICY:
//   retailPrice = vendorCost * 1.50 (50% markup), rounded up to nearest $5
//   WIOA-funded students pay $0 — self-pay students pay retailPrice
//   Revenue split: Elevate keeps markup, vendor cost paid to partner on invoice

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

export const HSI_COURSES: PartnerCourse[] = [
  {
    id: 'hsi-cpr-aed',
    partnerId: 'hsi',
    partnerName: 'Health & Safety Institute',
    title: 'CPR/AED Certification',
    description: 'American Heart Association CPR and AED certification training',
    category: 'Healthcare',
    duration: '4 hours',
    vendorCost: 22,
    retailPrice: 35,
    stripePriceId: 'price_1TL8XXH4a2yrVOt52fdgADbs',
    paymentLink: 'https://buy.stripe.com/dRmfZhbrq4QSfsD0wVgIo0j',
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
    vendorCost: 22,
    retailPrice: 35,
    stripePriceId: 'price_1TL8XYH4a2yrVOt5aNxzYQ5K',
    paymentLink: 'https://buy.stripe.com/3cIfZh0MM1EG6W71AZgIo0k',
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
    vendorCost: 15,
    retailPrice: 25,
    stripePriceId: 'price_1TL8XZH4a2yrVOt5m0S2EA4l',
    paymentLink: 'https://buy.stripe.com/28EdR92UUers3JV6VjgIo0l',
    enrollmentUrl: 'https://www.hsi.com/courses/bloodborne-pathogens',
    loginUrl: 'https://www.hsi.com/login',
    supportUrl: 'https://www.hsi.com/support',
    certificationType: 'Bloodborne Pathogens Certificate',
    isActive: true,
  },
];

export const NRF_COURSES: PartnerCourse[] = [
  {
    id: 'nrf-servsafe-manager',
    partnerId: 'nrf',
    partnerName: 'National Restaurant Foundation',
    title: 'ServSafe Manager Certification',
    description: 'Food safety manager certification recognized nationwide',
    category: 'Food Service',
    duration: '16 hours',
    vendorCost: 35,
    retailPrice: 55,
    stripePriceId: 'price_1TL8XZH4a2yrVOt5WGp5fqrm',
    paymentLink: 'https://buy.stripe.com/eVq28r5325UW2FR0wVgIo0m',
    enrollmentUrl: 'https://www.servsafe.com/access/ss/Catalog/ProductDetails/SSMC7',
    loginUrl: 'https://www.servsafe.com/login',
    supportUrl: 'https://www.servsafe.com/support',
    certificationType: 'ServSafe Manager Certificate',
    isActive: true,
  },
  {
    id: 'nrf-servsafe-food-handler',
    partnerId: 'nrf',
    partnerName: 'National Restaurant Foundation',
    title: 'ServSafe Food Handler',
    description: 'Entry-level food safety certification',
    category: 'Food Service',
    duration: '2 hours',
    vendorCost: 15,
    retailPrice: 25,
    stripePriceId: 'price_1TL8XaH4a2yrVOt57RA7dQXV',
    paymentLink: 'https://buy.stripe.com/3cI6oH9ji834a8j7ZngIo0n',
    enrollmentUrl: 'https://www.servsafe.com/access/ss/Catalog/ProductDetails/SSFH7',
    loginUrl: 'https://www.servsafe.com/login',
    supportUrl: 'https://www.servsafe.com/support',
    certificationType: 'ServSafe Food Handler Certificate',
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
    retailPrice: 30,
    stripePriceId: 'price_1TL8XbH4a2yrVOt5XvDSzwsS',
    paymentLink: 'https://buy.stripe.com/cNidR9brq4QS2FR93rgIo0o',
    enrollmentUrl: 'https://www.servsafe.com/access/ss/Catalog/ProductDetails/SSA7',
    loginUrl: 'https://www.servsafe.com/login',
    supportUrl: 'https://www.servsafe.com/support',
    certificationType: 'ServSafe Alcohol Certificate',
    isActive: true,
  },
];

// JRI courses are grant-funded — no self-pay, no Stripe
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

export const CAREERSAFE_COURSES: PartnerCourse[] = [
  {
    id: 'careersafe-osha10-general',
    partnerId: 'careersafe',
    partnerName: 'CareerSafe',
    title: 'OSHA 10-Hour General Industry',
    description: 'OSHA-authorized 10-hour general industry safety training',
    category: 'Safety',
    duration: '10 hours',
    vendorCost: 30,
    retailPrice: 45,
    stripePriceId: 'price_1TL8XbH4a2yrVOt5MPMXmq3E',
    paymentLink: 'https://buy.stripe.com/fZufZhgLK978dkva7vgIo0p',
    enrollmentUrl: 'https://www.careersafeonline.com/osha-10-hour-general-industry',
    loginUrl: 'https://www.careersafeonline.com/login',
    supportUrl: 'https://www.careersafeonline.com/support',
    certificationType: 'OSHA 10-Hour Card',
    isActive: true,
  },
  {
    id: 'careersafe-osha10-construction',
    partnerId: 'careersafe',
    partnerName: 'CareerSafe',
    title: 'OSHA 10-Hour Construction',
    description: 'OSHA-authorized 10-hour construction safety training',
    category: 'Safety',
    duration: '10 hours',
    vendorCost: 30,
    retailPrice: 45,
    stripePriceId: 'price_1TL8XcH4a2yrVOt5T2wuQxPc',
    paymentLink: 'https://buy.stripe.com/dRm4gzdzyfvw2FR4NbgIo0q',
    enrollmentUrl: 'https://www.careersafeonline.com/osha-10-hour-construction',
    loginUrl: 'https://www.careersafeonline.com/login',
    supportUrl: 'https://www.careersafeonline.com/support',
    certificationType: 'OSHA 10-Hour Card',
    isActive: true,
  },
  {
    id: 'careersafe-osha30-general',
    partnerId: 'careersafe',
    partnerName: 'CareerSafe',
    title: 'OSHA 30-Hour General Industry',
    description: 'Advanced OSHA safety training for supervisors and managers',
    category: 'Safety',
    duration: '30 hours',
    vendorCost: 89,
    retailPrice: 135,
    stripePriceId: 'price_1TL8XdH4a2yrVOt5zOAVN4qX',
    paymentLink: 'https://buy.stripe.com/14AcN5cvugzAbcn0wVgIo0r',
    enrollmentUrl: 'https://www.careersafeonline.com/osha-30-hour-general-industry',
    loginUrl: 'https://www.careersafeonline.com/login',
    supportUrl: 'https://www.careersafeonline.com/support',
    certificationType: 'OSHA 30-Hour Card',
    isActive: true,
  },
  {
    id: 'careersafe-bloodborne-pathogens',
    partnerId: 'careersafe',
    partnerName: 'CareerSafe',
    title: 'Bloodborne Pathogens Training',
    description: 'OSHA-compliant bloodborne pathogens training for healthcare workers',
    category: 'Healthcare Safety',
    duration: '1 hour',
    vendorCost: 15,
    retailPrice: 25,
    stripePriceId: 'price_1TL8XeH4a2yrVOt5wE5aAIUX',
    paymentLink: 'https://buy.stripe.com/dRm4gz7baers5S34NbgIo0s',
    enrollmentUrl: 'https://www.careersafeonline.com/bloodborne-pathogens',
    loginUrl: 'https://www.careersafeonline.com/login',
    supportUrl: 'https://www.careersafeonline.com/support',
    certificationType: 'Bloodborne Pathogens Certificate',
    isActive: true,
  },
  {
    id: 'careersafe-infection-control',
    partnerId: 'careersafe',
    partnerName: 'CareerSafe',
    title: 'Infection Control & Prevention',
    description: 'Healthcare infection control and prevention training',
    category: 'Healthcare Safety',
    duration: '2 hours',
    vendorCost: 15,
    retailPrice: 25,
    stripePriceId: 'price_1TL8XeH4a2yrVOt5eYMWsJJN',
    paymentLink: 'https://buy.stripe.com/eVq7sLfHG5UW5S34NbgIo0t',
    enrollmentUrl: 'https://www.careersafeonline.com/infection-control',
    loginUrl: 'https://www.careersafeonline.com/login',
    supportUrl: 'https://www.careersafeonline.com/support',
    certificationType: 'Infection Control Certificate',
    isActive: true,
  },
  {
    id: 'careersafe-patient-safety',
    partnerId: 'careersafe',
    partnerName: 'CareerSafe',
    title: 'Patient Safety & Care',
    description: 'Essential patient safety training for home health aides',
    category: 'Healthcare Safety',
    duration: '2 hours',
    vendorCost: 15,
    retailPrice: 25,
    stripePriceId: 'price_1TL8XfH4a2yrVOt5LDGUltFP',
    paymentLink: 'https://buy.stripe.com/14A14n1QQ4QS2FR6VjgIo0u',
    enrollmentUrl: 'https://www.careersafeonline.com/patient-safety',
    loginUrl: 'https://www.careersafeonline.com/login',
    supportUrl: 'https://www.careersafeonline.com/support',
    certificationType: 'Patient Safety Certificate',
    isActive: true,
  },
];

export const ALL_PARTNER_COURSES: PartnerCourse[] = [
  ...HSI_COURSES,
  ...NRF_COURSES,
  ...JRI_COURSES,
  ...CAREERSAFE_COURSES,
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
