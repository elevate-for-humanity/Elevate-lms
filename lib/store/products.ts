// Store Products Database
// Generated from LMS course content
//
// PRICING STRATEGY:
// - All prices include 40% markup for profit margin
// - No partner names or third-party branding included
// - JRI courses excluded from store (available only through LMS)

export type ProductCategory =
  | 'digital-workbook'
  | 'video-course'
  | 'certification-prep'
  | 'scorm-package'
  | 'physical-product'
  | 'template';

export interface StoreProduct {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  price: number;
  salePrice?: number;
  description: string;
  longDescription?: string;
  image: string;
  images?: string[];
  programId?: string; // Links to LMS course
  programName?: string;
  downloadUrl?: string; // For digital products
  videoUrl?: string; // For video products
  scormPackageId?: string; // For SCORM
  stripeProductId?: string;
  stripePriceId?: string;
  inStock: boolean;
  featured: boolean;
  digital: boolean; // True for instant download
  tags?: string[];
  requirements?: string[];
  includes?: string[];
}

// Digital Workbooks - One for each of 32 programs
// All prices include 40% markup for profit margin
export const digitalWorkbooks: StoreProduct[] = [
  {
    id: 'wb-barber-001',
    name: 'Barber Apprenticeship Complete Workbook',
    slug: 'barber-apprenticeship-workbook',
    category: 'digital-workbook',
    price: 49.0,
    description:
      'Complete study guide with all course materials, practice exercises, and state exam prep',
    longDescription:
      'This comprehensive workbook includes all reading materials from the Barber Apprenticeship program, organized practice exercises, state licensing exam preparation, and quick reference guides. Perfect for students who want offline study materials or supplemental resources.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'barber-001',
    programName: 'Barber Apprenticeship',
    inStock: true,
    featured: true,
    digital: true,
    tags: ['barber', 'apprenticeship', 'study-guide', 'exam-prep'],
    includes: [
      '200+ pages of course content',
      'Practice exercises and quizzes',
      'State exam preparation guide',
      'Quick reference charts',
      'Downloadable PDF format',
      'Lifetime access',
    ],
  },
  {
    id: 'wb-cna-001',
    name: 'CNA Training Complete Study Guide',
    slug: 'cna-training-study-guide',
    category: 'digital-workbook',
    price: 56.0,
    description:
      'Comprehensive CNA study materials with 500+ practice questions and skills checklist',
    longDescription:
      'Master your CNA certification with this complete study guide featuring all course materials, 500+ practice questions, clinical skills checklist, and state-specific exam preparation.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'cna-001',
    programName: 'CNA Training',
    inStock: true,
    featured: true,
    digital: true,
    tags: ['cna', 'healthcare', 'nursing', 'certification'],
    includes: [
      '250+ pages of study materials',
      '500+ practice questions',
      'Clinical skills checklist',
      'State exam prep guide',
      'Anatomy & physiology review',
      'Downloadable PDF',
    ],
  },
  {
    id: 'wb-hvac-001',
    name: 'HVAC Technician Complete Workbook',
    slug: 'hvac-technician-workbook',
    category: 'digital-workbook',
    price: 49.0,
    description: 'Technical diagrams, practice problems, and EPA 608 certification prep',
    longDescription:
      'Complete HVAC training workbook with technical diagrams, electrical schematics, practice problems, and comprehensive EPA 608 certification preparation for all types.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'hvac-001',
    programName: 'HVAC Technician',
    inStock: true,
    featured: true,
    digital: true,
    tags: ['hvac', 'trades', 'epa-608', 'certification'],
    includes: [
      '300+ pages of technical content',
      'Electrical schematics and diagrams',
      'EPA 608 prep (Core, Type I, II, III)',
      'Practice problems with solutions',
      'Troubleshooting guides',
      'Downloadable PDF',
    ],
  },
  {
    id: 'wb-medical-assistant-001',
    name: 'Medical Assistant Complete Bundle',
    slug: 'medical-assistant-bundle',
    category: 'digital-workbook',
    price: 70.0,
    salePrice: 56.0,
    description:
      'All course materials, clinical skills guide, and certification prep in one bundle',
    longDescription:
      'The ultimate Medical Assistant study package including all course materials, clinical procedures guide, administrative skills, and complete certification exam preparation.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'medical-assistant-001',
    programName: 'Medical Assistant',
    inStock: true,
    featured: true,
    digital: true,
    tags: ['medical-assistant', 'healthcare', 'certification', 'bundle'],
    includes: [
      '400+ pages of course content',
      'Clinical procedures guide',
      'Administrative skills manual',
      'Certification exam prep',
      'Practice tests',
      'Downloadable PDF bundle',
    ],
  },
];

// Video Courses
export const videoCourses: StoreProduct[] = [
  {
    id: 'vid-barber-001',
    name: 'Barber Skills Video Library',
    slug: 'barber-skills-video-library',
    category: 'video-course',
    price: 140.0,
    description: 'Complete video library with all barber training demonstrations and techniques',
    longDescription:
      'Lifetime access to our complete barber training video library featuring professional demonstrations of cuts, fades, shaves, and styling techniques. Stream or download for offline viewing.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'barber-001',
    programName: 'Barber Apprenticeship',
    inStock: true,
    featured: true,
    digital: true,
    tags: ['barber', 'video', 'training', 'techniques'],
    includes: [
      '50+ professional video lessons',
      'HD quality streaming',
      'Download for offline viewing',
      'Lifetime access',
      'Mobile-friendly',
      'Closed captions',
    ],
  },
  {
    id: 'vid-cna-001',
    name: 'CNA Clinical Skills Videos',
    slug: 'cna-clinical-skills-videos',
    category: 'video-course',
    price: 112.0,
    description: 'Step-by-step video demonstrations of all required CNA clinical skills',
    longDescription:
      'Master all required CNA clinical skills with our comprehensive video library featuring step-by-step demonstrations, common mistakes to avoid, and exam tips.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'cna-001',
    programName: 'CNA Training',
    inStock: true,
    featured: true,
    digital: true,
    tags: ['cna', 'healthcare', 'video', 'clinical-skills'],
    includes: [
      '30+ clinical skill demonstrations',
      'State exam skills coverage',
      'Common mistakes guide',
      'Exam tips and tricks',
      'Lifetime access',
      'Mobile-friendly',
    ],
  },
];

// Certification Prep
export const certificationPrep: StoreProduct[] = [
  {
    id: 'cert-barber-001',
    name: 'State Barber Exam Prep Course',
    slug: 'state-barber-exam-prep',
    category: 'certification-prep',
    price: 210.0,
    description:
      'Complete state barber licensing exam preparation with practice tests and study materials',
    longDescription:
      'Prepare for your state barber licensing exam with our comprehensive prep course featuring practice exams, study guides, and test-taking strategies. 90-day access.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'barber-001',
    programName: 'Barber Apprenticeship',
    inStock: true,
    featured: false,
    digital: true,
    tags: ['barber', 'exam-prep', 'certification', 'state-license'],
    includes: [
      '5 full-length practice exams',
      'State-specific content',
      'Study guides and flashcards',
      'Test-taking strategies',
      '90-day access',
      'Score tracking',
    ],
  },
  {
    id: 'cert-cna-001',
    name: 'CNA State Exam Prep Package',
    slug: 'cna-state-exam-prep',
    category: 'certification-prep',
    price: 140.0,
    description: 'State-specific CNA exam preparation with practice tests and skills videos',
    longDescription:
      'Pass your CNA state exam with confidence using our targeted prep package including practice tests, skills videos, and state-specific content. 60-day access.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'cna-001',
    programName: 'CNA Training',
    inStock: true,
    featured: false,
    digital: true,
    tags: ['cna', 'exam-prep', 'certification', 'state-exam'],
    includes: [
      '3 full-length practice exams',
      'Skills demonstration videos',
      'State-specific content',
      'Study schedule planner',
      '60-day access',
      'Performance analytics',
    ],
  },
  {
    id: 'cert-hvac-001',
    name: 'EPA 608 Certification Prep',
    slug: 'epa-608-certification-prep',
    category: 'certification-prep',
    price: 182.0,
    description: 'Complete EPA 608 certification prep for Core, Type I, Type II, and Type III',
    longDescription:
      'Master the EPA 608 certification exam with our comprehensive prep course covering Core, Type I, Type II, and Type III. Includes practice exams and study materials. 90-day access.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'hvac-001',
    programName: 'HVAC Technician',
    inStock: true,
    featured: true,
    digital: true,
    tags: ['hvac', 'epa-608', 'certification', 'exam-prep'],
    includes: [
      'Core exam prep',
      'Type I, II, III prep',
      '10+ practice exams',
      'Study guides',
      '90-day access',
      'Exam voucher discount',
    ],
  },
];

// Physical Products
export const physicalProducts: StoreProduct[] = [
  {
    id: 'phys-barber-kit-001',
    name: 'Professional Barber Tool Kit',
    slug: 'professional-barber-tool-kit',
    category: 'physical-product',
    price: 420.0,
    description:
      'Complete professional barber tool kit with clippers, scissors, combs, and carrying case',
    longDescription:
      'Everything you need to start your barber career. This professional-grade kit includes premium clippers, scissors, combs, brushes, and a durable carrying case.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'barber-001',
    programName: 'Barber Apprenticeship',
    inStock: true,
    featured: true,
    digital: false,
    tags: ['barber', 'tools', 'equipment', 'starter-kit'],
    includes: [
      'Professional clippers',
      'Barber scissors (2 pairs)',
      'Combs and brushes set',
      'Straight razor',
      'Neck duster',
      'Carrying case',
      '1-year warranty',
    ],
  },
  {
    id: 'phys-cna-scrubs-001',
    name: 'CNA Scrubs Set - Navy Blue',
    slug: 'cna-scrubs-navy-blue',
    category: 'physical-product',
    price: 64.0,
    description: 'Professional scrubs set including top and pants, available in sizes S-3XL',
    longDescription:
      'Comfortable, durable scrubs designed for healthcare professionals. Includes matching top and pants in professional navy blue. Multiple sizes available.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'cna-001',
    programName: 'CNA Training',
    inStock: true,
    featured: false,
    digital: false,
    tags: ['cna', 'scrubs', 'uniform', 'healthcare'],
    includes: [
      'Scrub top',
      'Scrub pants',
      'Multiple pockets',
      'Sizes S-3XL',
      'Machine washable',
      'Fade-resistant fabric',
    ],
  },
  {
    id: 'phys-hvac-kit-001',
    name: 'HVAC Tool Set - Starter Kit',
    slug: 'hvac-tool-set-starter',
    category: 'physical-product',
    price: 630.0,
    description: 'Essential HVAC tools including gauges, vacuum pump, and carrying case',
    longDescription:
      'Professional HVAC starter kit with all essential tools for residential and commercial work. Includes manifold gauges, vacuum pump, and durable carrying case.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'hvac-001',
    programName: 'HVAC Technician',
    inStock: true,
    featured: true,
    digital: false,
    tags: ['hvac', 'tools', 'equipment', 'starter-kit'],
    includes: [
      'Manifold gauge set',
      'Vacuum pump',
      'Refrigerant scale',
      'Leak detector',
      'Hand tools set',
      'Carrying case',
      '2-year warranty',
    ],
  },
  {
    id: 'phys-safety-001',
    name: 'Safety Equipment Bundle',
    slug: 'safety-equipment-bundle',
    category: 'physical-product',
    price: 112.0,
    description: 'OSHA-compliant safety glasses, gloves, and protective equipment',
    longDescription:
      'Complete safety equipment bundle for all trades programs. OSHA-compliant and industry-standard protective gear.',
    image: '/images/pages/comp-home-hero.webp',
    programId: 'all',
    programName: 'All Programs',
    inStock: true,
    featured: false,
    digital: false,
    tags: ['safety', 'ppe', 'equipment', 'osha'],
    includes: [
      'Safety glasses (ANSI Z87.1)',
      'Work gloves (3 pairs)',
      'Ear protection',
      'Dust masks',
      'Hard hat',
      'Safety vest',
    ],
  },
];

// All products combined
export const allProducts: StoreProduct[] = [
  ...digitalWorkbooks,
  ...videoCourses,
  ...certificationPrep,
  ...physicalProducts,
];

// Helper functions
export function getProductById(id: string): StoreProduct | undefined {
  return allProducts.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): StoreProduct | undefined {
  return allProducts.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: ProductCategory): StoreProduct[] {
  return allProducts.filter((p) => p.category === category);
}

export function getProductsByProgram(programId: string): StoreProduct[] {
  return allProducts.filter((p) => p.programId === programId || p.programId === 'all');
}

export function getFeaturedProducts(): StoreProduct[] {
  return allProducts.filter((p) => p.featured);
}

export function searchProducts(query: string): StoreProduct[] {
  const lowerQuery = query.toLowerCase();
  return allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );
}
