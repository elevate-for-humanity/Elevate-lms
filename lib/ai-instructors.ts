/**
 * AI Instructor System
 * 
 * Creates virtual instructors with unique voices and personalities
 * for different course categories.
 */

export interface AIInstructor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  avatar: string;
  bio: string;
  categories: string[];
}

export const AI_INSTRUCTORS: AIInstructor[] = [
  {
    id: 'dr-sarah-chen',
    name: 'Dr. Sarah Chen',
    title: 'Healthcare Education Director',
    specialty: 'Healthcare & Medical Training',
    voice: 'nova',
    avatar: '/images/team/instructors/instructor-health.jpg',
    bio: 'Dr. Chen brings 15 years of clinical nursing experience and healthcare education expertise. She specializes in CNA training, medical terminology, and patient care fundamentals.',
    categories: ['healthcare', 'cna', 'medical', 'nurse', 'phlebotomy', 'pharmacy', 'dental', 'emt', 'dsp', 'peer', 'recovery'],
  },
  {
    id: 'marcus-johnson',
    name: 'Marcus Johnson',
    title: 'Master Tradesman & Instructor',
    specialty: 'Skilled Trades & Construction',
    voice: 'onyx',
    avatar: '/images/team/instructors/instructor-trades.jpg',
    bio: 'Marcus is a licensed master electrician and HVAC technician with 20 years in the field. He leads our skilled trades programs with hands-on expertise.',
    categories: ['hvac', 'electrical', 'welding', 'construction', 'plumbing', 'carpentry', 'solar', 'building', 'manufacturing'],
  },
  {
    id: 'james-williams',
    name: 'James Williams',
    title: 'Master Barber & Educator',
    specialty: 'Barbering & Cosmetology',
    voice: 'echo',
    avatar: '/images/team/instructors/instructor-barber.jpg',
    bio: 'James is a licensed master barber with his own successful shop. He trains the next generation of barbers in cutting techniques, business management, and client relations.',
    categories: ['barber', 'cosmetology', 'beauty', 'esthetician', 'nail'],
  },
  {
    id: 'lisa-martinez',
    name: 'Lisa Martinez',
    title: 'Technology Training Lead',
    specialty: 'IT & Technology',
    voice: 'shimmer',
    avatar: '/images/team/instructors/instructor-tech.jpg',
    bio: 'Lisa is a Certiport-certified IT professional who transitioned from help desk to training. She makes technology accessible and prepares students for IT careers.',
    categories: ['it', 'tech', 'computer', 'software', 'cybersecurity', 'network', 'data'],
  },
  {
    id: 'robert-davis',
    name: 'Robert Davis',
    title: 'CDL Training Director',
    specialty: 'Transportation & Logistics',
    voice: 'fable',
    avatar: '/images/team/instructors/instructor-safety.jpg',
    bio: 'Robert is a veteran truck driver with over 2 million safe miles. He now trains new drivers in CDL certification, safety protocols, and career success.',
    categories: ['cdl', 'truck', 'driving', 'transportation', 'logistics', 'forklift', 'warehouse'],
  },
  {
    id: 'angela-thompson',
    name: 'Angela Thompson',
    title: 'Business & Professional Development Coach',
    specialty: 'Business & Career Services',
    voice: 'alloy',
    avatar: '/images/team/instructors/instructor-business.jpg',
    bio: 'Angela is a certified career coach and business trainer. She helps students develop professional skills, build resumes, and succeed in interviews.',
    categories: ['business', 'career', 'professional', 'office', 'admin', 'customer', 'retail', 'tax', 'accounting'],
  },
];

/**
 * Get the best instructor for a course based on its name/category
 */
export function getInstructorForCourse(courseName: string): AIInstructor {
  const lowerName = courseName.toLowerCase();
  
  for (const instructor of AI_INSTRUCTORS) {
    for (const category of instructor.categories) {
      if (lowerName.includes(category)) {
        return instructor;
      }
    }
  }
  
  // Default to Angela for general courses
  return AI_INSTRUCTORS[5];
}

/**
 * Generate instructor introduction script
 */
export function generateInstructorIntro(instructor: AIInstructor, courseName: string): string {
  return `Hello, I'm ${instructor.name}, ${instructor.title} here at Elevate for Humanity. Welcome to ${courseName}. ${instructor.bio.split('.')[0]}. I'll be guiding you through this program, sharing practical knowledge and real-world experience to help you succeed in your career.`;
}

/**
 * Generate lesson script with instructor personality
 */
export function generateLessonScript(
  instructor: AIInstructor,
  courseName: string,
  lessonNumber: number,
  lessonTitle: string,
  lessonContent: string,
  topics: string[]
): string {
  const intro = lessonNumber === 1 
    ? generateInstructorIntro(instructor, courseName) + ' '
    : `Welcome back to ${courseName}. I'm ${instructor.name}. `;
  
  const topicsText = topics.length > 0 
    ? `In this lesson, we'll cover: ${topics.join(', ')}. `
    : '';
  
  return `${intro}This is Lesson ${lessonNumber}: ${lessonTitle}. ${topicsText}${lessonContent} Remember, practice makes perfect. Take notes, ask questions, and apply what you learn. Let's get started.`;
}
