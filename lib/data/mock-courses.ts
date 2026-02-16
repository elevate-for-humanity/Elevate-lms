/**
 * Mock Course Data
 * Complete course catalog with lessons, quizzes, and content
 */

export interface MockCourse {
  course_id: string;
  title: string;
  description: string;
  duration: string;
  lessons_count: number;
  price: number;
  category: string;
  image_url: string;
  video_intro_url?: string;
  is_active: boolean;
}

export interface MockLesson {
  course_id: string;
  lesson_number: number;
  title: string;
  description: string;
  content: string;
  video_url?: string;
  duration_minutes: number;
  topics: string[];
  quiz_questions: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// Healthcare Courses
export const HEALTHCARE_COURSES: MockCourse[] = [
  {
    course_id: 'cna-fundamentals',
    title: 'CNA Fundamentals',
    description: 'Complete Certified Nursing Assistant training covering patient care, vital signs, infection control, and clinical skills required for state certification.',
    duration: '6 weeks',
    lessons_count: 12,
    price: 0,
    category: 'Healthcare',
    image_url: '/images/healthcare/program-cna-training.jpg',
    video_intro_url: '/videos/cna-hero.mp4',
    is_active: true,
  },
  {
    course_id: 'phlebotomy-basics',
    title: 'Phlebotomy Technician',
    description: 'Learn venipuncture techniques, blood collection procedures, specimen handling, and patient interaction for phlebotomy certification.',
    duration: '4 weeks',
    lessons_count: 8,
    price: 0,
    category: 'Healthcare',
    image_url: '/images/healthcare/phlebotomy-hero.jpg',
    is_active: true,
  },
  {
    course_id: 'medical-terminology',
    title: 'Medical Terminology',
    description: 'Master healthcare vocabulary including anatomical terms, medical abbreviations, and documentation standards used in clinical settings.',
    duration: '3 weeks',
    lessons_count: 6,
    price: 0,
    category: 'Healthcare',
    image_url: '/images/healthcare/medical-terminology.jpg',
    is_active: true,
  },
];

// Skilled Trades Courses
export const TRADES_COURSES: MockCourse[] = [
  {
    course_id: 'hvac-fundamentals',
    title: 'HVAC Fundamentals',
    description: 'Introduction to heating, ventilation, and air conditioning systems. Learn installation, maintenance, and troubleshooting of HVAC equipment.',
    duration: '8 weeks',
    lessons_count: 16,
    price: 0,
    category: 'Skilled Trades',
    image_url: '/images/trades/hero-program-hvac.jpg',
    video_intro_url: '/videos/hvac-hero-final.mp4',
    is_active: true,
  },
  {
    course_id: 'welding-basics',
    title: 'Welding Basics',
    description: 'Learn MIG, TIG, and stick welding techniques. Covers safety, equipment operation, and metal fabrication fundamentals.',
    duration: '6 weeks',
    lessons_count: 10,
    price: 0,
    category: 'Skilled Trades',
    image_url: '/images/trades/welding-hero.jpg',
    is_active: true,
  },
  {
    course_id: 'electrical-fundamentals',
    title: 'Electrical Fundamentals',
    description: 'Basic electrical theory, wiring methods, circuit analysis, and safety practices for aspiring electricians.',
    duration: '8 weeks',
    lessons_count: 14,
    price: 0,
    category: 'Skilled Trades',
    image_url: '/images/trades/electrical-hero.jpg',
    is_active: true,
  },
];

// Technology Courses
export const TECH_COURSES: MockCourse[] = [
  {
    course_id: 'comptia-a-plus',
    title: 'CompTIA A+ Certification Prep',
    description: 'Prepare for CompTIA A+ certification covering hardware, software, networking, and troubleshooting for IT support roles.',
    duration: '10 weeks',
    lessons_count: 20,
    price: 0,
    category: 'Technology',
    image_url: '/images/technology/hero-programs-technology.jpg',
    is_active: true,
  },
  {
    course_id: 'cybersecurity-basics',
    title: 'Cybersecurity Fundamentals',
    description: 'Introduction to cybersecurity concepts, threat detection, network security, and security best practices.',
    duration: '6 weeks',
    lessons_count: 12,
    price: 0,
    category: 'Technology',
    image_url: '/images/technology/cybersecurity-hero.jpg',
    is_active: true,
  },
];

// Business Courses
export const BUSINESS_COURSES: MockCourse[] = [
  {
    course_id: 'tax-preparation',
    title: 'Tax Preparation Certification',
    description: 'Learn individual tax preparation, IRS regulations, tax software, and client service skills for tax preparer certification.',
    duration: '4 weeks',
    lessons_count: 8,
    price: 0,
    category: 'Business',
    image_url: '/images/business/tax-prep-certification.jpg',
    is_active: true,
  },
  {
    course_id: 'customer-service',
    title: 'Customer Service Excellence',
    description: 'Develop professional communication, conflict resolution, and customer relationship skills for service industry careers.',
    duration: '2 weeks',
    lessons_count: 6,
    price: 0,
    category: 'Business',
    image_url: '/images/business/customer-service.jpg',
    is_active: true,
  },
];

// CDL/Transportation Courses
export const CDL_COURSES: MockCourse[] = [
  {
    course_id: 'cdl-class-a',
    title: 'CDL Class A Training',
    description: 'Complete commercial driver license training for Class A vehicles. Includes pre-trip inspection, backing maneuvers, and road skills.',
    duration: '4 weeks',
    lessons_count: 10,
    price: 0,
    category: 'Transportation',
    image_url: '/images/programs-hq/cdl-trucking.jpg',
    video_intro_url: '/videos/cdl-hero.mp4',
    is_active: true,
  },
];

// Barber/Cosmetology Courses
export const BARBER_COURSES: MockCourse[] = [
  {
    course_id: 'barber-fundamentals',
    title: 'Barber Fundamentals',
    description: 'Learn classic and modern cutting techniques, fades, beard grooming, and client consultation for barber apprenticeship.',
    duration: '12 weeks',
    lessons_count: 24,
    price: 0,
    category: 'Cosmetology',
    image_url: '/images/barber-hero.jpg',
    video_intro_url: '/videos/barber-hero-final.mp4',
    is_active: true,
  },
];

// All courses combined
export const ALL_COURSES: MockCourse[] = [
  ...HEALTHCARE_COURSES,
  ...TRADES_COURSES,
  ...TECH_COURSES,
  ...BUSINESS_COURSES,
  ...CDL_COURSES,
  ...BARBER_COURSES,
];

export function getCourseById(courseId: string): MockCourse | undefined {
  return ALL_COURSES.find(c => c.course_id === courseId);
}

export function getCoursesByCategory(category: string): MockCourse[] {
  return ALL_COURSES.filter(c => c.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(ALL_COURSES.map(c => c.category))];
}
