/**
 * Store Recommendation & Upsell Engine
 * Shows related products, upgrades, and bundles based on what user is viewing
 */

export interface Product {
  id: string;
  name: string;
  shortName: string;
  description: string;
  price: number;
  priceDisplay: string;
  href: string;
  image: string;
  category: 'license' | 'tool' | 'course' | 'program' | 'resource';
  tier: 'starter' | 'professional' | 'enterprise' | 'standalone';
  valueProps: string[]; // Key selling points
}

export interface Recommendation {
  product: Product;
  reason: string; // Why we're recommending this
  type: 'upsell' | 'cross-sell' | 'bundle' | 'upgrade';
  savings?: string; // "Save $500 when bundled"
}

// All products in the ecosystem
export const ALL_PRODUCTS: Product[] = [
  // Licenses (Tier hierarchy)
  {
    id: 'core-license',
    name: 'Core Platform License',
    shortName: 'Core License',
    description: 'Essential LMS with enrollment and basic compliance.',
    price: 4999,
    priceDisplay: '$4,999',
    href: '/store/licenses/core-license',
    image: '/images/pages/training-classroom.jpg',
    category: 'license',
    tier: 'starter',
    valueProps: [
      'Full LMS with course builder',
      'Student enrollment system',
      'Basic compliance tracking',
      'Email support',
    ],
  },
  {
    id: 'school-license',
    name: 'School / Training Provider License',
    shortName: 'School License',
    description: 'White-label platform with compliance tools and partner dashboard.',
    price: 15000,
    priceDisplay: '$15,000',
    href: '/store/licenses/school-license',
    image: '/images/pages/training-classroom.jpg',
    category: 'license',
    tier: 'professional',
    valueProps: [
      'Everything in Core, plus:',
      'White-label branding',
      'WIOA/FERPA compliance suite',
      'Partner & employer dashboard',
      'Case management system',
      'Priority support',
    ],
  },
  {
    id: 'enterprise-license',
    name: 'Enterprise License',
    shortName: 'Enterprise',
    description: 'Multi-site deployment with custom integrations and dedicated support.',
    price: 50000,
    priceDisplay: '$50,000',
    href: '/store/licenses/enterprise-license',
    image: '/images/pages/store-recommendations.jpg',
    category: 'license',
    tier: 'enterprise',
    valueProps: [
      'Everything in School, plus:',
      'Unlimited sites/locations',
      'Custom API integrations',
      'Dedicated account manager',
      'On-site training',
      'SLA guarantee',
    ],
  },
  // Compliance Tools
  {
    id: 'wioa-toolkit',
    name: 'WIOA Compliance Toolkit',
    shortName: 'WIOA Toolkit',
    description: 'Automated WIOA tracking, PIRL exports, and quarterly reporting.',
    price: 1999,
    priceDisplay: '$1,999',
    href: '/store/compliance/wioa',
    image: '/images/pages/career-counseling.jpg',
    category: 'tool',
    tier: 'standalone',
    valueProps: [
      'Saves 40+ hours per quarter',
      'One-click PIRL exports',
      'Automated performance tracking',
      'Pre-built report templates',
    ],
  },
  {
    id: 'ferpa-toolkit',
    name: 'FERPA Compliance Toolkit',
    shortName: 'FERPA Toolkit',
    description: 'Student data protection with encryption and audit logging.',
    price: 999,
    priceDisplay: '$999',
    href: '/store/compliance/ferpa',
    image: '/images/pages/training-classroom.jpg',
    category: 'tool',
    tier: 'standalone',
    valueProps: [
      'AES-256 encryption',
      'Role-based access control',
      'Complete audit trail',
      'Consent management',
    ],
  },
  {
    id: 'grant-reporting',
    name: 'Grant Reporting Suite',
    shortName: 'Grant Reports',
    description: 'Automated reporting for federal and state workforce grants.',
    price: 999,
    priceDisplay: '$999',
    href: '/store/compliance/grant-reporting',
    image: '/images/pages/training-classroom.jpg',
    category: 'tool',
    tier: 'standalone',
    valueProps: [
      'DOL ETA report templates',
      'Automated data collection',
      'One-click exports',
      'Outcome tracking',
    ],
  },
  // AI Tools
  {
    id: 'ai-tutor',
    name: 'AI Tutor License',
    shortName: 'AI Tutor',
    description: '24/7 AI-powered tutoring for learners with progress tracking.',
    price: 999,
    priceDisplay: '$999',
    href: '/store/ai-studio',
    image: '/images/pages/training-classroom.jpg',
    category: 'tool',
    tier: 'standalone',
    valueProps: [
      '24/7 learner support',
      'Personalized learning paths',
      'Progress analytics',
      'Reduces instructor workload',
    ],
  },
  // Programs
  {
    id: 'barber-program',
    name: 'Barber Apprenticeship Program',
    shortName: 'Barber Program',
    description: '2,000-hour state-approved apprenticeship curriculum.',
    price: 0,
    priceDisplay: 'WIOA Funded',
    href: '/programs/barber-apprenticeship',
    image: '/images/pages/training-classroom.jpg',
    category: 'program',
    tier: 'standalone',
    valueProps: [
      'State board approved',
      'Master barber instruction',
      'Job placement support',
      'WIOA eligible',
    ],
  },
  {
    id: 'cna-program',
    name: 'CNA Training Program',
    shortName: 'CNA Program',
    description: '6-week certified nursing assistant training.',
    price: 0,
    priceDisplay: 'WIOA Funded',
    href: '/programs/cna',
    image: '/images/pages/training-classroom.jpg',
    category: 'program',
    tier: 'standalone',
    valueProps: [
      'State certification prep',
      'Clinical rotations',
      'Job placement',
      'WIOA eligible',
    ],
  },
];

// Recommendation rules: what to show based on what they're viewing
export const RECOMMENDATION_RULES: Record<string, {
  upsells: string[];
  crossSells: string[];
  bundles: { products: string[]; savings: string }[];
  upgradeFrom?: string;
  upgradeTo?: string;
}> = {
  // Core License viewers
  'core-license': {
    upsells: [],
    crossSells: ['wioa-toolkit', 'ai-tutor'],
    bundles: [
      { products: ['core-license', 'wioa-toolkit', 'ferpa-toolkit'], savings: 'Save $500' },
    ],
    upgradeTo: 'school-license',
  },
  // School License viewers
  'school-license': {
    upsells: [],
    crossSells: ['ai-tutor', 'grant-reporting'],
    bundles: [
      { products: ['school-license', 'ai-tutor', 'grant-reporting'], savings: 'Save $800' },
    ],
    upgradeFrom: 'core-license',
    upgradeTo: 'enterprise-license',
  },
  // Enterprise viewers
  'enterprise-license': {
    upsells: [],
    crossSells: ['ai-tutor'],
    bundles: [],
    upgradeFrom: 'school-license',
  },
  // WIOA Toolkit viewers
  'wioa-toolkit': {
    upsells: ['school-license'], // "Get WIOA built-in with School License"
    crossSells: ['ferpa-toolkit', 'grant-reporting'],
    bundles: [
      { products: ['wioa-toolkit', 'ferpa-toolkit', 'grant-reporting'], savings: 'Save $400 - Complete Compliance Bundle' },
    ],
  },
  // FERPA Toolkit viewers
  'ferpa-toolkit': {
    upsells: ['school-license'],
    crossSells: ['wioa-toolkit', 'grant-reporting'],
    bundles: [
      { products: ['wioa-toolkit', 'ferpa-toolkit', 'grant-reporting'], savings: 'Save $400 - Complete Compliance Bundle' },
    ],
  },
  // Grant Reporting viewers
  'grant-reporting': {
    upsells: ['school-license'],
    crossSells: ['wioa-toolkit', 'ferpa-toolkit'],
    bundles: [
      { products: ['wioa-toolkit', 'ferpa-toolkit', 'grant-reporting'], savings: 'Save $400 - Complete Compliance Bundle' },
    ],
  },
  // AI Tutor viewers
  'ai-tutor': {
    upsells: ['school-license'],
    crossSells: ['wioa-toolkit'],
    bundles: [],
  },
  // Workbooks viewers (free content - upsell to licenses)
  'workbooks': {
    upsells: ['core-license', 'school-license'],
    crossSells: ['barber-program', 'cna-program'],
    bundles: [],
  },
  // Program viewers
  'barber-program': {
    upsells: ['school-license'], // "Run your own barber school"
    crossSells: ['cna-program', 'ai-tutor'],
    bundles: [],
  },
  'cna-program': {
    upsells: ['school-license'],
    crossSells: ['barber-program', 'ai-tutor'],
    bundles: [],
  },
};

// Get product by ID
export function getProduct(id: string): Product | undefined {
  return ALL_PRODUCTS.find(p => p.id === id);
}

// Get recommendations for a product
export function getRecommendations(productId: string): Recommendation[] {
  const rules = RECOMMENDATION_RULES[productId];
  if (!rules) return [];

  const recommendations: Recommendation[] = [];

  // Upgrade recommendation (most important)
  if (rules.upgradeTo) {
    const upgradeProduct = getProduct(rules.upgradeTo);
    if (upgradeProduct) {
      recommendations.push({
        product: upgradeProduct,
        reason: getUpgradeReason(productId, rules.upgradeTo),
        type: 'upgrade',
      });
    }
  }

  // Upsells
  rules.upsells.forEach(id => {
    const product = getProduct(id);
    if (product) {
      recommendations.push({
        product,
        reason: getUpsellReason(productId, id),
        type: 'upsell',
      });
    }
  });

  // Cross-sells
  rules.crossSells.forEach(id => {
    const product = getProduct(id);
    if (product) {
      recommendations.push({
        product,
        reason: getCrossSellReason(productId, id),
        type: 'cross-sell',
      });
    }
  });

  // Bundles
  rules.bundles.forEach(bundle => {
    const products = bundle.products.map(id => getProduct(id)).filter(Boolean) as Product[];
    if (products.length === bundle.products.length) {
      recommendations.push({
        product: products[0], // Primary product in bundle
        reason: `Bundle: ${products.map(p => p.shortName).join(' + ')}`,
        type: 'bundle',
        savings: bundle.savings,
      });
    }
  });

  return recommendations;
}

// Contextual reasons for recommendations
function getUpgradeReason(from: string, to: string): string {
  const reasons: Record<string, string> = {
    'core-license:school-license': 'Upgrade to School License for white-label branding, WIOA compliance, and partner dashboards - everything you need to run a training provider.',
    'school-license:enterprise-license': 'Scale to multiple locations with Enterprise. Get unlimited sites, custom integrations, and dedicated support.',
  };
  return reasons[`${from}:${to}`] || 'Upgrade for more features';
}

function getUpsellReason(viewing: string, suggesting: string): string {
  const reasons: Record<string, string> = {
    'wioa-toolkit:school-license': 'The School License includes WIOA compliance built-in, plus LMS, enrollment, and white-label branding.',
    'ferpa-toolkit:school-license': 'School License includes FERPA compliance plus the full platform - better value than standalone tools.',
    'grant-reporting:school-license': 'Get grant reporting plus the complete workforce platform with School License.',
    'ai-tutor:school-license': 'AI Tutor is included with School License, along with LMS and compliance tools.',
    'workbooks:core-license': 'Want to create your own courses? Core License gives you a full LMS with course builder.',
    'workbooks:school-license': 'Run your own training program with School License - includes LMS, compliance, and white-label branding.',
    'barber-program:school-license': 'Want to run your own barber school? School License gives you everything you need.',
    'cna-program:school-license': 'Start your own CNA training program with School License.',
  };
  return reasons[`${viewing}:${suggesting}`] || 'You might also need this';
}

function getCrossSellReason(viewing: string, suggesting: string): string {
  const reasons: Record<string, string> = {
    'core-license:wioa-toolkit': 'Add WIOA compliance to track participant outcomes and generate required reports.',
    'core-license:ai-tutor': 'Add AI Tutor to provide 24/7 learner support and reduce instructor workload.',
    'school-license:ai-tutor': 'Enhance your platform with AI-powered tutoring for better learner outcomes.',
    'school-license:grant-reporting': 'Automate your grant reporting with one-click exports and outcome tracking.',
    'wioa-toolkit:ferpa-toolkit': 'Complete your compliance suite with FERPA data protection.',
    'wioa-toolkit:grant-reporting': 'Streamline all your reporting with the Grant Reporting Suite.',
    'ferpa-toolkit:wioa-toolkit': 'Add WIOA tracking to meet all workforce compliance requirements.',
    'ferpa-toolkit:grant-reporting': 'Automate grant reporting alongside your data protection.',
    'grant-reporting:wioa-toolkit': 'Add WIOA compliance for complete workforce program tracking.',
    'grant-reporting:ferpa-toolkit': 'Protect student data with FERPA compliance tools.',
    'ai-tutor:wioa-toolkit': 'Track learner outcomes for WIOA reporting with the compliance toolkit.',
    'barber-program:cna-program': 'Expand your offerings with CNA training.',
    'barber-program:ai-tutor': 'Add AI tutoring to support your barber students 24/7.',
    'cna-program:barber-program': 'Diversify with barber training programs.',
    'cna-program:ai-tutor': 'Support CNA students with AI-powered tutoring.',
    'workbooks:barber-program': 'Interested in barbering? Check out our full apprenticeship program.',
    'workbooks:cna-program': 'Looking for healthcare training? See our CNA program.',
  };
  return reasons[`${viewing}:${suggesting}`] || 'Customers also purchased';
}

// Avatar sales messages for each product
export const AVATAR_SALES_MESSAGES: Record<string, {
  intro: string;
  valueHighlight: string;
  objectionHandler: string;
  callToAction: string;
}> = {
  'core-license': {
    intro: "The Core License is perfect if you're just getting started with online training.",
    valueHighlight: "You get a full LMS with course builder, student enrollment, and basic compliance tracking - everything to launch your first program.",
    objectionHandler: "If you need white-label branding or WIOA compliance later, you can upgrade to School License anytime.",
    callToAction: "Ready to launch your training platform? Let's get you set up.",
  },
  'school-license': {
    intro: "This is our most popular license - it's what real training providers use.",
    valueHighlight: "You get white-label branding so it looks like YOUR platform, plus WIOA and FERPA compliance built in. The partner dashboard lets employers track their sponsored students.",
    objectionHandler: "The $15,000 pays for itself fast - one WIOA-funded cohort of 10 students can bring in $50,000+ in training revenue.",
    callToAction: "Want me to show you how other training providers are using this?",
  },
  'enterprise-license': {
    intro: "Enterprise is for organizations running multiple training sites or needing custom integrations.",
    valueHighlight: "Unlimited locations, API access for your existing systems, and a dedicated account manager who knows your business.",
    objectionHandler: "We'll do the integration work and train your team on-site. You focus on training, we handle the tech.",
    callToAction: "Let's schedule a call to discuss your specific needs.",
  },
  'wioa-toolkit': {
    intro: "If you're running WIOA-funded programs, this toolkit saves you serious time.",
    valueHighlight: "Automated PIRL exports, performance tracking, and quarterly reports. What used to take 40 hours now takes 10 minutes.",
    objectionHandler: "It's $1,999 one-time - that's less than one week of a compliance officer's salary.",
    callToAction: "Want to see a demo of the PIRL export?",
  },
  'ai-tutor': {
    intro: "AI Tutor gives your students 24/7 support without burning out your instructors.",
    valueHighlight: "It answers questions, explains concepts, and tracks where students are struggling. Your instructors can focus on hands-on training.",
    objectionHandler: "Students love it because they get help at 2am when they're studying. Instructors love it because they're not answering the same questions 50 times.",
    callToAction: "Try it yourself - ask it anything about your program.",
  },
};
