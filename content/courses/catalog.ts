export interface Course {
  id: string;
  course_name: string;
  shortDescription: string;
  path: string;
  coverImageKey: string;
  category?: string;
  duration?: string;
  level?: string;
}

export const courses: Course[] = [
  {
    id: 'cna',
    course_name: 'Certified Nursing Assistant (CNA)',
    shortDescription: 'State-approved CNA training program preparing students for certification and employment in healthcare facilities.',
    path: '/programs/cna',
    coverImageKey: 'cna-training',
    category: 'Healthcare',
    duration: '6-8 weeks',
    level: 'Entry',
  },
  {
    id: 'barber',
    course_name: 'Barber Apprenticeship',
    shortDescription: 'DOL-registered apprenticeship combining classroom instruction with hands-on barbershop training.',
    path: '/programs/barber-apprenticeship',
    coverImageKey: 'barber-training',
    category: 'Skilled Trades',
    duration: '18 months',
    level: 'Entry',
  },
  {
    id: 'cdl',
    course_name: 'CDL Commercial Driving',
    shortDescription: 'Commercial Driver License training for Class A and Class B vehicles with job placement assistance.',
    path: '/programs/cdl-transportation',
    coverImageKey: 'cdl-trucking',
    category: 'Transportation',
    duration: '4-6 weeks',
    level: 'Entry',
  },
  {
    id: 'hvac',
    course_name: 'HVAC Technician',
    shortDescription: 'Heating, ventilation, and air conditioning training with EPA certification preparation.',
    path: '/programs/hvac',
    coverImageKey: 'hvac-technician',
    category: 'Skilled Trades',
    duration: '12 weeks',
    level: 'Entry',
  },
  {
    id: 'medical-assistant',
    course_name: 'Medical Assistant',
    shortDescription: 'Clinical and administrative medical assistant training with externship placement.',
    path: '/programs/medical-assistant/apply',
    coverImageKey: 'medical-assistant',
    category: 'Healthcare',
    duration: '10-12 weeks',
    level: 'Entry',
  },
  {
    id: 'cybersecurity',
    course_name: 'Cybersecurity Fundamentals',
    shortDescription: 'Entry-level cybersecurity training covering network security, threat analysis, and CompTIA Security+ prep.',
    path: '/programs/technology/cybersecurity',
    coverImageKey: 'cybersecurity',
    category: 'Technology',
    duration: '10 weeks',
    level: 'Entry',
  },
  {
    id: 'welding',
    course_name: 'Welding Technology',
    shortDescription: 'Hands-on welding training covering MIG, TIG, and stick welding with AWS certification prep.',
    path: '/programs/welding/apply',
    coverImageKey: 'welding',
    category: 'Skilled Trades',
    duration: '12 weeks',
    level: 'Entry',
  },
  {
    id: 'it-support',
    course_name: 'IT Support Specialist',
    shortDescription: 'CompTIA A+ and Network+ preparation with hands-on lab experience and help desk training.',
    path: '/programs/technology/it-support',
    coverImageKey: 'it-support',
    category: 'Technology',
    duration: '8-10 weeks',
    level: 'Entry',
  },
];

export default courses;
