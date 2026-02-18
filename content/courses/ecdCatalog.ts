export interface EcdCourse {
  id: string;
  course_name: string;
  shortDescription: string;
  path: string;
  coverImageKey: string;
  category?: string;
  duration?: string;
  provider?: string;
}

export const ecdCourses: EcdCourse[] = [
  {
    id: 'careersafe-osha10',
    course_name: 'CareerSafe OSHA 10',
    shortDescription: 'OSHA 10-hour general industry safety certification through CareerSafe online platform.',
    path: '/courses/careersafe',
    coverImageKey: 'training-classroom',
    category: 'Safety',
    duration: '10 hours',
    provider: 'CareerSafe',
  },
  {
    id: 'nrf-customer-service',
    course_name: 'NRF Customer Service',
    shortDescription: 'National Retail Federation customer service and sales certification program.',
    path: '/courses/nrf',
    coverImageKey: 'business-training',
    category: 'Business',
    duration: '20 hours',
    provider: 'NRF',
  },
  {
    id: 'nds-digital-skills',
    course_name: 'NDS Digital Skills',
    shortDescription: 'National Digital Skills certification covering digital literacy and workplace technology.',
    path: '/courses/nds',
    coverImageKey: 'technology-hero',
    category: 'Technology',
    duration: '15 hours',
    provider: 'NDS',
  },
  {
    id: 'capital-readiness',
    course_name: 'Capital Readiness',
    shortDescription: 'Financial literacy and capital readiness training for aspiring entrepreneurs.',
    path: '/courses/capital-readiness',
    coverImageKey: 'business-office',
    category: 'Business',
    duration: '8 hours',
    provider: 'Elevate',
  },
];

export default ecdCourses;
