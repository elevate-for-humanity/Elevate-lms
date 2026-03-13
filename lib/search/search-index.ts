/**
 * Universal Search Index
 * All searchable content across the site with audience tags
 */

export type Audience = 'students' | 'organizations' | 'developers' | 'employers' | 'instructors' | 'everyone';

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  href: string;
  category: 'program' | 'course' | 'product' | 'license' | 'tool' | 'resource' | 'page' | 'dashboard';
  audiences: Audience[];
  keywords: string[];
  image?: string;
  price?: string;
  badge?: string;
}

export const SEARCH_INDEX: SearchItem[] = [
  // ============================================
  // PROGRAMS
  // ============================================
  {
    id: 'barber-apprenticeship',
    title: 'Barber Apprenticeship Program',
    description: '2,000-hour state-approved apprenticeship with master barber instruction and job placement.',
    href: '/programs/barber-apprenticeship',
    category: 'program',
    audiences: ['students', 'everyone'],
    keywords: ['barber', 'barbering', 'cosmetology', 'hair', 'cutting', 'fades', 'apprentice', 'license'],
    image: '/images/pages/training-classroom.jpg',
    price: 'WIOA Funded',
    badge: 'WIOA Eligible',
  },
  {
    id: 'cna-training',
    title: 'CNA Training Program',
    description: '6-week certified nursing assistant training with clinical rotations and state exam prep.',
    href: '/programs/cna',
    category: 'program',
    audiences: ['students', 'everyone'],
    keywords: ['cna', 'nursing', 'healthcare', 'medical', 'nurse', 'assistant', 'clinical', 'hospital'],
    image: '/images/pages/training-classroom.jpg',
    price: 'WIOA Funded',
    badge: 'WIOA Eligible',
  },
  {
    id: 'hvac-training',
    title: 'HVAC Technician Training',
    description: '8-week HVAC certification with EPA 608 prep and hands-on equipment training.',
    href: '/programs/hvac',
    category: 'program',
    audiences: ['students', 'everyone'],
    keywords: ['hvac', 'heating', 'cooling', 'air conditioning', 'refrigeration', 'epa', 'technician'],
    image: '/images/pages/training-classroom.jpg',
    price: 'WIOA Funded',
    badge: 'WIOA Eligible',
  },
  {
    id: 'cdl-training',
    title: 'CDL Truck Driver Training',
    description: '4-week commercial driver license training with behind-the-wheel instruction.',
    href: '/programs/cdl',
    category: 'program',
    audiences: ['students', 'everyone'],
    keywords: ['cdl', 'truck', 'driver', 'trucking', 'commercial', 'driving', 'transportation', 'logistics'],
    image: '/images/pages/training-classroom.jpg',
    price: 'WIOA Funded',
    badge: 'WIOA Eligible',
  },
  {
    id: 'tax-preparation',
    title: 'Tax Preparer Training',
    description: '8-week tax preparation certification. Earn $50-150 per return during tax season.',
    href: '/programs/tax-preparation',
    category: 'program',
    audiences: ['students', 'everyone'],
    keywords: ['tax', 'taxes', 'irs', 'preparer', 'preparation', 'accounting', 'finance', 'ptin'],
    image: '/images/pages/training-classroom.jpg',
    price: '$499',
  },

  // ============================================
  // PLATFORM LICENSES
  // ============================================
  {
    id: 'core-license',
    title: 'Core Platform License',
    description: 'Essential LMS with course builder, enrollment system, and basic compliance tracking.',
    href: '/store/licenses/core-license',
    category: 'license',
    audiences: ['organizations', 'developers'],
    keywords: ['lms', 'platform', 'license', 'core', 'basic', 'starter', 'learning management'],
    image: '/images/pages/training-classroom.jpg',
    price: '$4,999',
  },
  {
    id: 'school-license',
    title: 'School / Training Provider License',
    description: 'White-label platform with WIOA compliance, partner dashboard, and case management.',
    href: '/store/licenses/school-license',
    category: 'license',
    audiences: ['organizations'],
    keywords: ['school', 'training', 'provider', 'white-label', 'wioa', 'compliance', 'lms', 'platform'],
    image: '/images/pages/training-classroom.jpg',
    price: '$15,000',
    badge: 'Most Popular',
  },
  {
    id: 'enterprise-license',
    title: 'Enterprise License',
    description: 'Multi-site deployment with custom integrations, API access, and dedicated support.',
    href: '/store/licenses/enterprise-license',
    category: 'license',
    audiences: ['organizations'],
    keywords: ['enterprise', 'multi-site', 'api', 'integration', 'custom', 'large', 'organization'],
    image: '/images/pages/store-recommendations.jpg',
    price: '$50,000',
  },
  {
    id: 'developer-starter',
    title: 'Developer Starter License',
    description: 'Full source code access for self-hosting. Perfect for developers and agencies.',
    href: '/store/licenses/developer-starter',
    category: 'license',
    audiences: ['developers'],
    keywords: ['developer', 'source code', 'self-host', 'github', 'clone', 'agency', 'code'],
    image: '/images/pages/training-classroom.jpg',
    price: '$299',
  },
  {
    id: 'developer-pro',
    title: 'Developer Pro License',
    description: 'Full source code with commercial rights, priority support, and white-label rights.',
    href: '/store/licenses/developer-pro',
    category: 'license',
    audiences: ['developers'],
    keywords: ['developer', 'pro', 'commercial', 'source code', 'white-label', 'resell'],
    image: '/images/pages/training-classroom.jpg',
    price: '$999',
  },

  // ============================================
  // COMPLIANCE TOOLS
  // ============================================
  {
    id: 'wioa-toolkit',
    title: 'WIOA Compliance Toolkit',
    description: 'Automated WIOA tracking, PIRL exports, and quarterly reporting. Saves 40+ hours/quarter.',
    href: '/store/compliance/wioa',
    category: 'tool',
    audiences: ['organizations'],
    keywords: ['wioa', 'compliance', 'pirl', 'workforce', 'reporting', 'tracking', 'dol'],
    image: '/images/pages/career-counseling.jpg',
    price: '$1,999',
  },
  {
    id: 'ferpa-toolkit',
    title: 'FERPA Compliance Toolkit',
    description: 'Student data protection with AES-256 encryption, access controls, and audit logging.',
    href: '/store/compliance/ferpa',
    category: 'tool',
    audiences: ['organizations'],
    keywords: ['ferpa', 'privacy', 'student data', 'encryption', 'compliance', 'security'],
    image: '/images/pages/training-classroom.jpg',
    price: '$999',
  },
  {
    id: 'grant-reporting',
    title: 'Grant Reporting Suite',
    description: 'Automated reporting for federal and state workforce grants with one-click exports.',
    href: '/store/compliance/grant-reporting',
    category: 'tool',
    audiences: ['organizations'],
    keywords: ['grant', 'reporting', 'federal', 'state', 'dol', 'export', 'outcomes'],
    image: '/images/pages/training-classroom.jpg',
    price: '$999',
  },
  {
    id: 'ai-tutor',
    title: 'AI Tutor License',
    description: '24/7 AI-powered tutoring for learners with personalized support and progress tracking.',
    href: '/store/ai-studio',
    category: 'tool',
    audiences: ['organizations', 'students'],
    keywords: ['ai', 'tutor', 'artificial intelligence', 'chatbot', 'support', 'learning', '24/7'],
    image: '/images/pages/training-classroom.jpg',
    price: '$999',
    badge: 'New',
  },

  // ============================================
  // SHOP PRODUCTS
  // ============================================
  {
    id: 'shop-tools',
    title: 'Professional Tools',
    description: 'HVAC tool kits, barber shears, and professional equipment for training programs.',
    href: '/shop?category=tools',
    category: 'product',
    audiences: ['students', 'everyone'],
    keywords: ['tools', 'equipment', 'kit', 'professional', 'hvac', 'barber', 'shears'],
    image: '/images/pages/training-classroom.jpg',
  },
  {
    id: 'shop-apparel',
    title: 'Apparel & Scrubs',
    description: 'Medical scrubs, uniforms, and branded apparel for students and professionals.',
    href: '/shop?category=apparel',
    category: 'product',
    audiences: ['students', 'everyone'],
    keywords: ['scrubs', 'uniform', 'apparel', 'clothing', 'medical', 'hoodie', 'shirt'],
    image: '/images/pages/training-classroom.jpg',
  },
  {
    id: 'shop-books',
    title: 'Study Guides & Books',
    description: 'Textbooks, study guides, and exam prep materials for all programs.',
    href: '/shop?category=books',
    category: 'product',
    audiences: ['students', 'everyone'],
    keywords: ['books', 'study', 'guide', 'textbook', 'exam', 'prep', 'materials'],
    image: '/images/pages/training-classroom.jpg',
  },

  // ============================================
  // RESOURCES
  // ============================================
  {
    id: 'workbooks',
    title: 'Program Workbooks',
    description: 'Free downloadable workbooks and study materials for enrolled students.',
    href: '/workbooks',
    category: 'resource',
    audiences: ['students'],
    keywords: ['workbook', 'download', 'pdf', 'study', 'materials', 'free'],
    image: '/images/pages/training-classroom.jpg',
    price: 'Free',
  },
  {
    id: 'marketplace',
    title: 'Course Marketplace',
    description: 'Expert-created courses in trades, healthcare, technology, and business.',
    href: '/marketplace',
    category: 'resource',
    audiences: ['students', 'everyone'],
    keywords: ['courses', 'marketplace', 'online', 'learning', 'training', 'expert'],
    image: '/images/pages/training-classroom.jpg',
  },

  // ============================================
  // DASHBOARDS & PORTALS
  // ============================================
  {
    id: 'student-dashboard',
    title: 'Student Dashboard',
    description: 'Access your courses, track progress, and download materials.',
    href: '/lms/dashboard',
    category: 'dashboard',
    audiences: ['students'],
    keywords: ['dashboard', 'student', 'courses', 'progress', 'login'],
  },
  {
    id: 'instructor-dashboard',
    title: 'Instructor Dashboard',
    description: 'Manage courses, grade assignments, and track student progress.',
    href: '/instructor/dashboard',
    category: 'dashboard',
    audiences: ['instructors'],
    keywords: ['instructor', 'teacher', 'dashboard', 'grading', 'courses'],
  },
  {
    id: 'admin-dashboard',
    title: 'Admin Dashboard',
    description: 'Platform administration, reporting, and compliance management.',
    href: '/admin/dashboard',
    category: 'dashboard',
    audiences: ['organizations'],
    keywords: ['admin', 'administration', 'dashboard', 'reports', 'management'],
  },
  {
    id: 'employer-portal',
    title: 'Employer Portal',
    description: 'Find trained candidates, post jobs, and access OJT programs.',
    href: '/employers',
    category: 'dashboard',
    audiences: ['employers'],
    keywords: ['employer', 'hiring', 'jobs', 'candidates', 'ojt', 'workforce'],
  },
  {
    id: 'partner-portal',
    title: 'Partner Dashboard',
    description: 'Track sponsored students and generate outcome reports.',
    href: '/partner/dashboard',
    category: 'dashboard',
    audiences: ['organizations'],
    keywords: ['partner', 'sponsor', 'workforce', 'outcomes', 'reports'],
  },

  // ============================================
  // KEY PAGES
  // ============================================
  {
    id: 'wioa-eligibility',
    title: 'WIOA Eligibility Check',
    description: 'See if you qualify for free workforce training through WIOA funding.',
    href: '/wioa-eligibility',
    category: 'page',
    audiences: ['students', 'everyone'],
    keywords: ['wioa', 'eligibility', 'free', 'funding', 'qualify', 'workforce'],
  },
  {
    id: 'demo',
    title: 'Platform Demo',
    description: 'Try the platform with a free interactive demo.',
    href: '/demo',
    category: 'page',
    audiences: ['organizations', 'developers', 'everyone'],
    keywords: ['demo', 'trial', 'free', 'try', 'test', 'preview'],
  },
  {
    id: 'contact',
    title: 'Contact Us',
    description: 'Get in touch with our team for questions, support, or sales.',
    href: '/contact',
    category: 'page',
    audiences: ['everyone'],
    keywords: ['contact', 'support', 'help', 'sales', 'questions', 'phone', 'email'],
  },
];

// ============================================
// SEARCH FUNCTIONS
// ============================================

export function searchItems(query: string, audience?: Audience, category?: string): SearchItem[] {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery && !audience && !category) {
    return [];
  }

  let results = SEARCH_INDEX;

  // Filter by audience
  if (audience && audience !== 'everyone') {
    results = results.filter(item => 
      item.audiences.includes(audience) || item.audiences.includes('everyone')
    );
  }

  // Filter by category
  if (category) {
    results = results.filter(item => item.category === category);
  }

  // Search by query
  if (normalizedQuery) {
    results = results.filter(item => {
      const searchText = `${item.title} ${item.description} ${item.keywords.join(' ')}`.toLowerCase();
      return searchText.includes(normalizedQuery);
    });

    // Sort by relevance (title match first, then keyword match)
    results.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(normalizedQuery) ? 0 : 1;
      const bTitle = b.title.toLowerCase().includes(normalizedQuery) ? 0 : 1;
      return aTitle - bTitle;
    });
  }

  return results;
}

export function getItemsByAudience(audience: Audience): SearchItem[] {
  return SEARCH_INDEX.filter(item => 
    item.audiences.includes(audience) || item.audiences.includes('everyone')
  );
}

export function getItemsByCategory(category: string): SearchItem[] {
  return SEARCH_INDEX.filter(item => item.category === category);
}

export function getFeaturedForAudience(audience: Audience, limit = 6): SearchItem[] {
  const items = getItemsByAudience(audience);
  // Prioritize items with badges
  return items
    .sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0))
    .slice(0, limit);
}
