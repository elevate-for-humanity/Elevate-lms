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
  welcomeMessage: "Hi, I'm PARIS. Tell me what you want to accomplish and I'll show you the best product, live demo and starting plan.",
  questions: [
    {
      id: 'main',
      question: 'What are you trying to do?',
      choices: [
        {
          id: 'build-website',
          label: 'Build or improve my website',
          icon: 'shopping-bag',
          route: '/store/demo/capability/website_builder',
          description: 'See PARIS turn business instructions into a branded, mobile-ready website and publishing workflow.',
        },
        {
          id: 'manage-customers',
          label: 'Get leads and manage customers',
          icon: 'server',
          route: '/store/demo/capability/crm',
          description: 'See CRM, forms, booking, follow-up and customer records working together.',
        },
        {
          id: 'sell-training',
          label: 'Create and sell courses or training',
          icon: 'graduation-cap',
          route: '/store/demo/capability/course_builder',
          description: 'See course creation, lessons, learner delivery, progress and certificates in one system.',
        },
        {
          id: 'run-workforce',
          label: 'Run workforce or apprenticeship programs',
          icon: 'book-open',
          route: '/store/demo/institutional',
          description: 'See enrollment, employers, apprentices, compliance, outcomes and reporting.',
        },
        {
          id: 'see-demos',
          label: 'Let PARIS walk me through the platform',
          icon: 'graduation-cap',
          route: '#marketplace',
          startTour: true,
          tourId: 'paris-platform-sales-tour',
          description: 'PARIS will speak, navigate the Store, explain subscription families, and show you where to try each product.',
        },
        {
          id: 'not-sure',
          label: 'Help me choose',
          icon: 'help-circle',
          route: '',
          description: 'Answer one quick question and PARIS will narrow the options.',
        },
      ],
      followUp: 'clarify',
    },
    {
      id: 'clarify',
      question: 'Which description sounds most like you?',
      choices: [
        {
          id: 'small-business',
          label: 'Small business or independent professional',
          icon: 'shopping-bag',
          route: '/store/plans',
          description: 'Start with a website, CRM and the focused apps you need now.',
        },
        {
          id: 'training-provider',
          label: 'Training provider or school',
          icon: 'graduation-cap',
          route: '/store/demo/admin',
          description: 'See admissions, courses, learner progress, certificates and operations.',
        },
        {
          id: 'workforce-board',
          label: 'Workforce or government organization',
          icon: 'server',
          route: '/store/demo/institutional',
          description: 'See eligibility, provider, compliance, employer and outcome workflows.',
        },
        {
          id: 'employer',
          label: 'Employer or host business',
          icon: 'book-open',
          route: '/store/demo/employer',
          description: 'See hiring, candidates, apprenticeships and workforce requests.',
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
  'paris-platform-sales-tour': {
    id: 'paris-platform-sales-tour',
    name: 'Platform Sales Walkthrough',
    steps: [
      {
        target: '[data-paris-tour="subscription-families"]',
        title: 'Choose the way you want to start',
        content: 'Elevate combines websites, customer management, training, workforce operations, and business tools. Start with the subscription family that matches your main outcome; PARIS can narrow it with a short interview.',
        placement: 'bottom',
      },
      {
        target: '[data-paris-tour="product-search"]',
        title: 'Find the exact capability',
        content: 'Search by the work you need done, such as website, CRM, courses, apprenticeships, compliance, grants, or marketing. You do not have to know a product name.',
        placement: 'bottom',
      },
      {
        target: '[data-paris-tour="product-cards"]',
        title: 'See what each product actually does',
        content: 'Every product card explains the outcome, shows a unique visual preview, and identifies the current starting price or plan relationship.',
        placement: 'top',
      },
      {
        target: '[data-paris-tour="product-actions"]',
        title: 'Try before you choose',
        content: 'Use Watch Live Demo to operate the workflow yourself, or Explore Product for the full feature and fit explanation. Ask PARIS any question while you compare.',
        placement: 'top',
      },
      {
        target: '[data-paris-tour="start-plan"]',
        title: 'Build the smallest setup that fits',
        content: 'Compare current plans, start with the essentials, and add only the capabilities your organization needs. PARIS can recommend the base plan and relevant add-ons from your interview.',
        placement: 'top',
      },
    ],
  },
  'shop-tour': {
    id: 'shop-tour',
    name: 'Shop Tour',
    steps: [
      {
        target: '[data-tour="shop-categories"]',
        title: 'Browse Categories',
        content:
          'Filter products by category: Tools, Apparel, Books, Safety gear, and Accessories.',
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
        content:
          'License a complete platform for enrollment, training delivery, compliance reporting, and outcome tracking. Stop building from scratch.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="license-managed"]',
        title: 'Managed Platform ($1,500-$3,500/mo)',
        content:
          'We host and maintain everything. You get your own branded instance with your domain. Includes LMS, student/instructor/employer portals, WIOA compliance, and 24/7 support. Launch in 2 weeks.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="license-source"]',
        title: 'Source-Use License ($75,000+)',
        content:
          'For large agencies requiring on-premise deployment. Get restricted code access to deploy on your infrastructure. Requires dedicated DevOps team and enterprise approval.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="license-features"]',
        title: 'What Every License Includes',
        content:
          'Complete LMS with courses and certificates, multi-stakeholder portals, WIOA-compliant reporting, automated workflows, enterprise security, and dedicated support.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="license-cta"]',
        title: 'Ready to Get Started?',
        content:
          'View detailed pricing, watch a demo, or schedule a call with our team to discuss your specific needs.',
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
