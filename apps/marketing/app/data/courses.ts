// Course Catalog Data - Marketing site
export interface Course {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  provider: string;
  category: string;
  price: number;
  duration: string;
  hours: number;
  image: string;
  features: string[];
}

export const COURSES: Course[] = [
  {
    id: 'mos-word',
    slug: 'microsoft-word-certification',
    name: 'Microsoft Word Certification',
    shortDescription: 'Become a Microsoft Office Specialist in Word',
    description: 'Master Microsoft Word and earn your official MOS certification.',
    provider: 'Certiport',
    category: 'Microsoft Office',
    price: 176,
    duration: '4-6 weeks',
    hours: 40,
    image: '/images/pages/courses-page-1.webp',
    features: ['Document creation', 'Formatting', 'Collaboration'],
  },
  {
    id: 'mos-excel',
    slug: 'microsoft-excel-certification',
    name: 'Microsoft Excel Certification',
    shortDescription: 'Become a Microsoft Office Specialist in Excel',
    description: 'Master Excel for data analysis and earn MOS certification.',
    provider: 'Certiport',
    category: 'Microsoft Office',
    price: 176,
    duration: '4-6 weeks',
    hours: 40,
    image: '/images/pages/courses-page-1.webp',
    features: ['Data analysis', 'Formulas', 'Charts'],
  },
];
