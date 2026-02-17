/**
 * Store Landing Card Configuration
 * Centralized taxonomy for consistent card ordering across devices
 */

export interface StoreCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  image: string;
  icon: 'shopping-bag' | 'graduation-cap' | 'book-open' | 'server' | 'credit-card' | 'settings' | 'users' | 'file-text';
  tourId: string; // data-tour attribute value
  tier: 'primary' | 'secondary';
  order: number;
  tourDescription: string; // What the tour says about this card
}

// Tier 1: Primary cards (above the fold, max 5)
export const primaryCards: StoreCard[] = [
  {
    id: 'licenses',
    title: 'Platform Licenses',
    subtitle: 'LMS & Workforce Solutions',
    description: 'Full workforce platform with LMS, admin dashboard, enrollment, and compliance tools.',
    href: '/store/licenses',
    image: '/images/programs-hq/it-support.jpg',
    icon: 'server',
    tourId: 'store-card-licenses',
    tier: 'primary',
    order: 1,
    tourDescription: 'License our complete workforce platform for your organization. Includes LMS, admin tools, compliance, and white-label options.',
  },
  {
    id: 'apps',
    title: 'AI Tools & Apps',
    subtitle: 'SAM.gov, Grants & More',
    description: 'AI-powered tools for compliance, grants, content creation, and student support.',
    href: '/store/apps',
    image: '/images/programs-hq/technology-hero.jpg',
    icon: 'settings',
    tourId: 'store-card-apps',
    tier: 'primary',
    order: 2,
    tourDescription: 'Access AI tools for SAM.gov registration, grant discovery, content creation, and 24/7 student tutoring.',
  },
  {
    id: 'courses',
    title: 'Career Courses',
    subtitle: 'Industry Certifications',
    description: 'Self-paced courses in healthcare, trades, technology, and business with certifications.',
    href: '/store/courses',
    image: '/images/programs-hq/healthcare-hero.jpg',
    icon: 'graduation-cap',
    tourId: 'store-card-courses',
    tier: 'primary',
    order: 3,
    tourDescription: 'Browse career training courses with industry-recognized certifications.',
  },
  {
    id: 'digital',
    title: 'Digital Resources',
    subtitle: 'Toolkits & Templates',
    description: 'Business toolkits, grant guides, compliance templates, and digital downloads.',
    href: '/store/digital',
    image: '/images/programs-hq/business-office.jpg',
    icon: 'file-text',
    tourId: 'store-card-digital',
    tier: 'primary',
    order: 4,
    tourDescription: 'Download business toolkits, grant writing guides, and professional templates.',
  },
  {
    id: 'subscriptions',
    title: 'Plans & Pricing',
    subtitle: 'Subscriptions & Checkout',
    description: 'View pricing plans, manage subscriptions, and complete purchases.',
    href: '/store/subscriptions',
    image: '/images/team-hq/team-meeting.jpg',
    icon: 'credit-card',
    tourId: 'store-card-pricing',
    tier: 'primary',
    order: 5,
    tourDescription: 'Compare pricing plans and subscription options. Find the right tier for individuals, schools, or enterprises.',
  },
];

// Tier 2: Secondary cards (below divider)
export const secondaryCards: StoreCard[] = [
  {
    id: 'compliance',
    title: 'Compliance Tools',
    subtitle: 'WIOA, FERPA, WCAG',
    description: 'Compliance checklists, templates, and automated reporting tools.',
    href: '/store/compliance',
    image: '/images/heroes-hq/funding-hero.jpg',
    icon: 'file-text',
    tourId: 'store-card-compliance',
    tier: 'secondary',
    order: 6,
    tourDescription: 'Access WIOA, FERPA, and WCAG compliance tools for workforce programs.',
  },
  {
    id: 'programs',
    title: 'Training Programs',
    subtitle: 'WIOA-Funded Training',
    description: 'Enroll in WIOA-eligible training programs with job placement support.',
    href: '/programs',
    image: '/images/barber-vibrant.jpg',
    icon: 'users',
    tourId: 'store-card-programs',
    tier: 'secondary',
    order: 7,
    tourDescription: 'Browse career training programs including Barber, CNA, HVAC, and CDL.',
  },
  {
    id: 'demo',
    title: 'Request Demo',
    subtitle: 'See Platform in Action',
    description: 'Schedule a personalized demo of our workforce training platform.',
    href: '/store/demo',
    image: '/images/programs-hq/cybersecurity.jpg',
    icon: 'users',
    tourId: 'store-card-demo',
    tier: 'secondary',
    order: 8,
    tourDescription: 'Schedule a demo to see how our platform can transform your training operations.',
  },
  {
    id: 'contact',
    title: 'Contact Sales',
    subtitle: 'Enterprise Solutions',
    description: 'Talk to our team about custom solutions for your organization.',
    href: '/contact',
    image: '/images/team-hq/instructor-1.jpg',
    icon: 'users',
    tourId: 'store-card-contact',
    tier: 'secondary',
    order: 9,
    tourDescription: 'Connect with our sales team for enterprise pricing and custom solutions.',
  },
];

// Combined and sorted
export const allStoreCards = [...primaryCards, ...secondaryCards].sort((a, b) => a.order - b.order);

// Helper to get card by ID
export function getStoreCard(id: string): StoreCard | undefined {
  return allStoreCards.find(card => card.id === id);
}

// Tour steps derived from cards
export const storeTourSteps = primaryCards.map(card => ({
  target: `[data-tour="${card.tourId}"]`,
  title: card.title,
  content: card.tourDescription,
  placement: 'bottom' as const,
}));
