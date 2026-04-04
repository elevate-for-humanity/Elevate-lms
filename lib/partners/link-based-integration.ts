// lib/partners/link-based-integration.ts
// Link-based partner integration system (no API keys needed)
// Partners: HSI, NRF, JRI, CareerSafe

export interface PartnerCourse {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  price: number;
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

// HSI (Health & Safety Institute) Courses
export const HSI_COURSES: PartnerCourse[] = [
  {
    id: 'hsi-cpr-aed',
    partnerId: 'hsi',
    partnerName: 'Health & Safety Institute',
    title: 'CPR/AED Certification',
    description: 'American Heart Association CPR and AED certification training',
    category: 'Healthcare',
    duration: '4 hours',
    price: 0, // Free through WIOA
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
    price: 0,
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
    price: 0,
    enrollmentUrl: 'https://www.hsi.com/courses/bloodborne-pathogens',
    loginUrl: 'https://www.hsi.com/login',
    supportUrl: 'https://www.hsi.com/support',
    certificationType: 'Bloodborne Pathogens Certificate',
    isActive: true,
  },
];

// NRF (National Restaurant Foundation) Courses
export const NRF_COURSES: PartnerCourse[] = [
  {
    id: 'nrf-servsafe-manager',
    partnerId: 'nrf',
    partnerName: 'National Restaurant Foundation',
    title: 'ServSafe Manager Certification',
    description: 'Food safety manager certification recognized nationwide',
    category: 'Food Service',
    duration: '16 hours',
    price: 0,
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
    price: 0,
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
    price: 0,
    enrollmentUrl: 'https://www.servsafe.com/access/ss/Catalog/ProductDetails/SSA7',
    loginUrl: 'https://www.servsafe.com/login',
    supportUrl: 'https://www.servsafe.com/support',
    certificationType: 'ServSafe Alcohol Certificate',
    isActive: true,
  },
];

// JRI (Job Ready Indy) / EmployIndy Courses
export const JRI_COURSES: PartnerCourse[] = [
  {
    id: 'jri-work-ethic',
    partnerId: 'jri',
    partnerName: 'Job Ready Indy',
    title: 'Work Ethic & Professionalism',
    description: 'Essential workplace skills and professional development',
    category: 'Soft Skills',
    duration: '8 hours',
    price: 0,
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
    price: 0,
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
    price: 0,
    enrollmentUrl: 'https://employindy.tovutilms.com',
    loginUrl: 'https://employindy.tovutilms.com/login',
    supportUrl: 'https://employindy.org/contact',
    certificationType: 'JRI Self-Management Certificate',
    isActive: true,
  },
];

// CareerSafe Courses
export const CAREERSAFE_COURSES: PartnerCourse[] = [
  {
    id: 'careersafe-osha10-general',
    partnerId: 'careersafe',
    partnerName: 'CareerSafe',
    title: 'OSHA 10-Hour General Industry',
    description: 'OSHA-authorized 10-hour general industry safety training',
    category: 'Safety',
    duration: '10 hours',
    price: 0,
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
    price: 0,
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
    description: 'Advanced OSHA safety training for supervisors',
    category: 'Safety',
    duration: '30 hours',
    price: 0,
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
    price: 0,
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
    price: 0,
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
    price: 0,
    enrollmentUrl: 'https://www.careersafeonline.com/patient-safety',
    loginUrl: 'https://www.careersafeonline.com/login',
    supportUrl: 'https://www.careersafeonline.com/support',
    certificationType: 'Patient Safety Certificate',
    isActive: true,
  },
];

// All partner courses combined
// Beauty/barber theory is delivered via Elevate LMS — no external partner courses
export const ALL_PARTNER_COURSES: PartnerCourse[] = [
  ...HSI_COURSES,
  ...NRF_COURSES,
  ...JRI_COURSES,
  ...CAREERSAFE_COURSES,
];

// Helper functions
export function getPartnerCourses(partnerId: string): PartnerCourse[] {
  return ALL_PARTNER_COURSES.filter(course => course.partnerId === partnerId);
}

export function getCourseById(courseId: string): PartnerCourse | undefined {
  return ALL_PARTNER_COURSES.find(course => course.id === courseId);
}

export function getCoursesByCategory(category: string): PartnerCourse[] {
  return ALL_PARTNER_COURSES.filter(course => course.category === category);
}

export function getActiveCourses(): PartnerCourse[] {
  return ALL_PARTNER_COURSES.filter(course => course.isActive);
}

// Enrollment tracking (no API needed - just track links)
export async function createPartnerEnrollment(
  studentId: string,
  courseId: string
): Promise<PartnerEnrollment> {
  const course = getCourseById(courseId);

  if (!course) {
    throw new Error(`Course not found: ${courseId}`);
  }

  return {
    id: `enroll_${Date.now()}`,
    studentId,
    courseId,
    partnerId: course.partnerId,
    enrollmentUrl: course.enrollmentUrl,
    status: 'pending',
  };
}

// Generate enrollment instructions
export function getEnrollmentInstructions(courseId: string): string {
  const course = getCourseById(courseId);

  if (!course) {
    return 'Course not found';
  }

  return `
To enroll in ${course.title}:

1. Click the enrollment link: ${course.enrollmentUrl}
2. Create an account or log in at: ${course.loginUrl}
3. Complete the course at your own pace
4. Upon completion, your certificate will be available
5. Need help? Contact support: ${course.supportUrl}

This course is 100% free through WIOA funding.
  `.trim();
}
