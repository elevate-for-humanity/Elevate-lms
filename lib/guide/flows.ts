/**
 * Store Guide Flow Configuration
 * Structured routing based on user needs - config-driven for easy updates
 */

export interface GuideChoice {
  id: string;
  label: string;
  icon: 'shopping-bag' | 'graduation-cap' | 'book-open' | 'server' | 'help-circle';
  route: string;
  startTour?: boolean;
  tourId?: string;
  description?: string;
}

export interface GuideQuestion {
  id: string;
  question: string;
  choices: GuideChoice[];
  followUp?: string; // ID of follow-up question if "Not sure" is selected
}

export interface GuideFlow {
  id: string;
  welcomeMessage: string;
  questions: GuideQuestion[];
}

// Main store guide flow
export const storeGuideFlow: GuideFlow = {
  id: 'store-main',
  welcomeMessage: "Hi! I'm your guide to the Elevate platform. Let me show you around.",
  questions: [
    {
      id: 'main',
      question: 'What brings you here today?',
      choices: [
        {
          id: 'see-demo',
          label: 'Show me the platform',
          icon: 'graduation-cap',
          route: '/demo/admin',
          startTour: false,
          description: 'Open the interactive demo — click through the admin dashboard, employer portal, and student experience with real sample data.',
        },
        {
          id: 'license-platform',
          label: 'I want to license it',
          icon: 'server',
          route: '/store/licensing',
          startTour: true,
          tourId: 'licenses-tour',
          description: 'Managed hosting from $1,500/mo or enterprise source-use licensing. See what\'s included.',
        },
        {
          id: 'start-trial',
          label: 'Start a free trial',
          icon: 'shopping-bag',
          route: '/store/trial',
          startTour: false,
          description: '14-day trial with your own branded instance. No credit card required.',
        },
        {
          id: 'not-sure',
          label: "I'm not sure yet",
          icon: 'help-circle',
          route: '',
          startTour: false,
        },
      ],
      followUp: 'clarify',
    },
    {
      id: 'clarify',
      question: 'No problem. Tell me a bit about you:',
      choices: [
        {
          id: 'workforce-board',
          label: 'I work at a workforce board',
          icon: 'server',
          route: '/demo/admin/wioa',
          startTour: false,
          description: 'See WIOA eligibility, ITA tracking, PIRL reporting, and provider network management.',
        },
        {
          id: 'training-provider',
          label: 'I run a training program',
          icon: 'graduation-cap',
          route: '/demo/admin',
          startTour: false,
          description: 'See enrollment management, course delivery, compliance, and outcome tracking.',
        },
        {
          id: 'employer',
          label: 'I\'m an employer partner',
          icon: 'shopping-bag',
          route: '/demo/employer',
          startTour: false,
          description: 'See candidate matching, apprenticeship tracking, and hiring incentives.',
        },
        {
          id: 'browse',
          label: 'Just exploring',
          icon: 'book-open',
          route: '/store/demos',
          startTour: false,
          description: 'Browse all the demos and see what the platform can do.',
        },
      ],
    },
  ],
};

// Destination-specific mini tours
export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

export interface DestinationTour {
  id: string;
  name: string;
  steps: TourStep[];
}

export const destinationTours: Record<string, DestinationTour> = {
  'shop-tour': {
    id: 'shop-tour',
    name: 'Shop Tour',
    steps: [
      {
        target: '[data-tour="shop-categories"]',
        title: 'Browse Categories',
        content: 'Filter products by category: Tools, Apparel, Books, Safety gear, and Accessories.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="shop-product"]',
        title: 'Product Cards',
        content: 'Click any product to see details, reviews, and add to cart.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="shop-cart"]',
        title: 'Your Cart',
        content: 'View your cart and proceed to checkout when ready.',
        placement: 'left',
      },
    ],
  },
  'marketplace-tour': {
    id: 'marketplace-tour',
    name: 'Marketplace Tour',
    steps: [
      {
        target: '[data-tour="marketplace-search"]',
        title: 'Search Courses',
        content: 'Search for courses by topic, skill, or instructor name.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="marketplace-filters"]',
        title: 'Filter by Category',
        content: 'Browse courses in Trades, Healthcare, Technology, Business, and Creative fields.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="marketplace-course"]',
        title: 'Course Cards',
        content: 'See ratings, student count, duration, and price. Click to view full details.',
        placement: 'bottom',
      },
    ],
  },
  'licenses-tour': {
    id: 'licenses-tour',
    name: 'Platform Licenses Tour',
    steps: [
      {
        target: '[data-tour="license-hero"]',
        title: 'Workforce Operating System',
        content: 'License a complete platform for enrollment, training delivery, compliance reporting, and outcome tracking. Stop building from scratch.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="license-managed"]',
        title: 'Managed Platform ($1,500-$3,500/mo)',
        content: 'We host and maintain everything. You get your own branded instance with your domain. Includes LMS, student/instructor/employer portals, WIOA compliance, and 24/7 support. Launch in 2 weeks.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="license-source"]',
        title: 'Source-Use License ($75,000+)',
        content: 'For large agencies requiring on-premise deployment. Get restricted code access to deploy on your infrastructure. Requires dedicated DevOps team and enterprise approval.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="license-features"]',
        title: 'What Every License Includes',
        content: 'Complete LMS with courses and certificates, multi-stakeholder portals, WIOA-compliant reporting, automated workflows, enterprise security, and dedicated support.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="license-cta"]',
        title: 'Ready to Get Started?',
        content: 'View detailed pricing, watch a demo, or schedule a call with our team to discuss your specific needs.',
        placement: 'top',
      },
    ],
  },
  'store-tour': {
    id: 'store-tour',
    name: 'Store Overview Tour',
    steps: [
      {
        target: '[data-tour="store-card-shop"]',
        title: 'Shop Gear',
        content: 'Professional tools, equipment, and apparel for training programs.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="store-card-marketplace"]',
        title: 'Courses Marketplace',
        content: 'Expert-created courses in trades, healthcare, tech, and business.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="store-card-workbooks"]',
        title: 'Workbooks & Downloads',
        content: 'Free study guides and materials for enrolled students.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="store-card-licenses"]',
        title: 'Platform Licenses',
        content: 'License our complete workforce platform for your organization.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="store-card-pricing"]',
        title: 'Plans & Pricing',
        content: 'Compare subscription plans and complete purchases.',
        placement: 'bottom',
      },
    ],
  },
};

// LocalStorage keys for persistence
export const GUIDE_STORAGE_KEYS = {
  DISMISSED: 'elevate-store-guide-dismissed',
  COMPLETED: 'elevate-store-guide-completed',
  TOUR_COMPLETED: (tourId: string) => `elevate-tour-${tourId}-completed`,
};

// Analytics event names
export const GUIDE_ANALYTICS = {
  GUIDE_OPENED: 'guide_opened',
  GUIDE_COMPLETED: 'guide_completed',
  GUIDE_DISMISSED: 'guide_dismissed',
  TOUR_STARTED: 'tour_started',
  TOUR_COMPLETED: 'tour_completed',
  ROUTE_SELECTED: 'route_selected',
};
