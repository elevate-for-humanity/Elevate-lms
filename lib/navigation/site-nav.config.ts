/**
 * SITE NAVIGATION CONFIGURATION
 *
 * Single source of truth for global site navigation.
 * Used by SiteHeader and SiteFooter components.
 */

export interface NavLink {
  label: string;
  href: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  href?: string;
  items: NavLink[];
}

/**
 * HEADER NAVIGATION
 * Top-level navigation with dropdown menus
 */
export const headerNavigation: NavGroup[] = [
  {
    label: 'Programs',
    items: [
      {
        label: 'All Programs',
        href: '/programs',
        description: 'Browse all training programs',
      },
      {
        label: 'Healthcare',
        href: '/programs/healthcare',
        description: 'CNA, Medical Assistant, Home Health',
      },
      {
        label: 'CNA Training',
        href: '/programs/cna',
        description: 'Certified Nursing Assistant',
      },
      {
        label: 'Skilled Trades',
        href: '/programs/skilled-trades',
        description: 'HVAC, Building Maintenance',
      },
      {
        label: 'Barber Apprenticeship',
        href: '/programs/barber-apprenticeship',
        description: 'DOL-registered earn while you learn',
      },
      {
        label: 'Cosmetology Apprenticeship',
        href: '/programs/cosmetology-apprenticeship',
        description: 'Indiana cosmetology license track',
      },
      {
        label: 'CDL Training',
        href: '/programs/cdl-training',
        description: 'Commercial Driver License',
      },
      {
        label: 'Business Programs',
        href: '/programs/business-administration',
        description: 'Tax prep, entrepreneurship',
      },
      {
        label: 'Technology',
        href: '/programs/technology',
        description: 'IT and tech careers',
      },
      {
        label: 'Apprenticeships',
        href: '/programs/apprenticeships',
        description: 'Earn while you learn programs',
      },
      {
        label: 'Find Your Path',
        href: '/pathways',
        description: 'Career pathway explorer',
      },
    ],
  },
  {
    label: 'For Students',
    items: [
      {
        label: 'How It Works',
        href: '/how-it-works',
        description: 'Step-by-step enrollment process',
      },
      {
        label: 'Funding & Support',
        href: '/funding',
        description: 'Free training and financial aid',
      },
      {
        label: 'Career Services',
        href: '/career-services',
        description: 'Job placement assistance',
      },
      {
        label: 'Employment Support',
        href: '/employment-support',
        description: 'Individualized employment & barrier reduction services',
      },
      {
        label: 'Success Stories',
        href: '/success',
        description: 'Student testimonials',
      },
      {
        label: 'Apply Now',
        href: '/apply',
        description: 'Start your application',
      },
      {
        label: 'LMS Overview',
        href: '/lms',
        description: 'Learning management system',
      },
      {
        label: 'Student Login',
        href: '/learner/dashboard',
        description: 'Access your courses',
      },
    ],
  },
  {
    label: 'For Employers',
    items: [
      {
        label: 'Hire Talent',
        href: '/employer/dashboard',
        description: 'Find job-ready candidates',
      },
      {
        label: 'Post a Job',
        href: '/employer/post-job',
        description: 'List your open positions',
      },
      {
        label: 'Apprenticeships',
        href: '/employer/apprenticeships',
        description: 'Build your workforce',
      },
      {
        label: 'Partner Benefits',
        href: '/employer/dashboard',
        description: 'Why partner with us',
      },
      {
        label: 'Employer Login',
        href: '/employer/dashboard',
        description: 'Access your portal',
      },
    ],
  },
  {
    label: 'For Partners',
    items: [
      {
        label: 'Become a Partner',
        href: '/partners',
        description: 'Training provider partnerships',
      },
      {
        label: '🔥 License Platform',
        href: '/pricing/platform',
        description: 'Use our $650K in government approvals - $2K-$200K/mo',
      },
      {
        label: 'Apprenticeship Licensing',
        href: '/pricing/sponsor-licensing',
        description: 'RAPIDS apprenticeship infrastructure - $750/mo',
      },
      {
        label: 'Program Holder Portal',
        href: '/program-holder/dashboard',
        description: 'Manage your programs',
      },
      {
        label: 'Compliance & Reporting',
        href: '/partners/compliance',
        description: 'WIOA compliance tools',
      },
      {
        label: 'Partner Resources',
        href: '/partners/resources',
        description: 'Guides and documentation',
      },
      {
        label: 'Partner Training',
        href: '/for-providers',
        description: 'Training provider resources',
      },
      {
        label: 'Partner Technology',
        href: '/partners/technology',
        description: 'Technology integration',
      },
      {
        label: 'Workforce Partners',
        href: '/partners/workforce',
        description: 'Workforce development partnerships',
      },
      {
        label: 'Reentry Partners',
        href: '/partners/reentry',
        description: 'Justice-involved reentry programs',
      },
      {
        label: 'Create Program',
        href: '/partners/create-program',
        description: 'Start a new training program',
      },
      {
        label: 'MOU',
        href: '/partners/mou',
        description: 'Memorandum of understanding',
      },
      {
        label: 'Partner Sales',
        href: '/partners/sales',
        description: 'Sales and partnership inquiries',
      },
      {
        label: 'Barber Shop Partners',
        href: '/partners/barber-shop',
        description: 'Barber apprenticeship shops',
      },
      {
        label: 'Cosmetology Salon Partners',
        href: '/partners/cosmetology-apprenticeship',
        description: 'Host cosmetology apprentices',
      },
      {
        label: 'CareerSafe',
        href: '/partners/careersafe',
        description: 'CareerSafe OSHA training',
      },
      {
        label: 'HSI Partners',
        href: '/partners/hsi',
        description: 'HSI training partnership',
      },
      {
        label: 'JRI Partners',
        href: '/partners/jri',
        description: 'Job Ready Indy',
      },
      {
        label: 'NRF Partners',
        href: '/partners/nrf',
        description: 'National Retail Federation',
      },
    ],
  },
  {
    label: 'About',
    items: [
      { label: 'Our Mission', href: '/about', description: 'Who we are and what we do' },
      { label: 'Mission Statement', href: '/about/mission', description: 'Our mission' },
      { label: 'About Partners', href: '/about/partners', description: 'Our partners' },
      { label: 'Our Team', href: '/about/team', description: 'Meet the team' },
      { label: 'Founder', href: '/founder', description: 'Meet the founder' },
      { label: 'Impact & Results', href: '/impact', description: 'Our outcomes and metrics' },
      { label: 'News & Press', href: '/press', description: 'Press and media' },
      { label: 'Contact Us', href: '/contact', description: 'Get in touch' },
      { label: 'What We Do', href: '/what-we-do', description: 'Our services' },
      { label: 'What We Offer', href: '/what-we-offer', description: 'Our offerings' },
      { label: 'Credentials', href: '/credentials', description: 'Our credentials' },
      { label: 'Transparency', href: '/transparency', description: 'Transparency report' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'Blog', href: '/blog', description: 'Career advice and insights' },
      { label: 'Blog Search', href: '/blog/search', description: 'Search articles' },
      { label: 'FAQs', href: '/faq', description: 'Common questions answered' },
      { label: 'Locations', href: '/locations', description: 'Find training near you' },
      { label: 'Site Map', href: '/site-map', description: 'All pages directory' },
      { label: 'Help Center', href: '/help', description: 'Support and documentation' },
      { label: 'Help Tutorials', href: '/help/tutorials', description: 'Video tutorials' },
      {
        label: 'Certifications Guide',
        href: '/help/articles/certifications',
        description: 'Certification info',
      },
      { label: 'Support Chat', href: '/support/chat', description: 'Live chat support' },
      { label: 'Academic Calendar', href: '/academic-calendar', description: 'Academic schedule' },
      {
        label: 'Academic Integrity',
        href: '/academic-integrity',
        description: 'Academic policies',
      },
      { label: 'Consumer Education', href: '/consumer-education', description: 'Consumer info' },
    ],
  },
  {
    label: 'Community',
    items: [
      { label: 'Community Hub', href: '/community/members', description: 'Join the community' },
      { label: 'Classroom', href: '/community/classroom', description: 'Virtual classroom' },
      {
        label: 'Career Discussions',
        href: '/community/discussions/career',
        description: 'Career talk',
      },
      {
        label: 'General Discussions',
        href: '/community/discussions/general',
        description: 'General forum',
      },
      { label: 'Leaderboard', href: '/community/leaderboard', description: 'Top contributors' },
      {
        label: 'Marketplace',
        href: '/community/marketplace',
        description: 'Community marketplace',
      },
      {
        label: 'Mentorship',
        href: '/mentorship/career-guidance',
        description: 'Career mentorship',
      },
      { label: 'Goal Setting', href: '/mentorship/goal-setting', description: 'Set career goals' },
      {
        label: 'Industry Insights',
        href: '/mentorship/industry-insights',
        description: 'Industry knowledge',
      },
      {
        label: 'Networking',
        href: '/mentorship/networking',
        description: 'Professional networking',
      },
      {
        label: 'Skill Development',
        href: '/mentorship/skill-development',
        description: 'Build skills',
      },
      {
        label: 'Ongoing Support',
        href: '/mentorship/ongoing-support',
        description: 'Continued mentorship',
      },
    ],
  },
  {
    label: 'Services',
    items: [
      { label: 'All Services', href: '/services', description: 'Our service offerings' },
      {
        label: 'Career Training Indiana',
        href: '/career-training-indiana',
        description: 'Indiana workforce programs',
      },
      {
        label: 'Community Services Indiana',
        href: '/community-services-indiana',
        description: 'IN community services',
      },
      {
        label: 'Community Services',
        href: '/community-services',
        description: 'Community services overview',
      },
    ],
  },
];

/**
 * FOOTER NAVIGATION
 * Organized into columns for footer layout
 */
export const footerNavigation = {
  programs: {
    title: 'Programs',
    links: [
      { label: 'All Programs', href: '/programs' },
      { label: 'Healthcare', href: '/programs/healthcare' },
      { label: 'Skilled Trades', href: '/programs/skilled-trades' },
      { label: 'Technology', href: '/programs/technology' },
      { label: 'Business', href: '/programs/business-administration' },
      { label: 'Career Pathways', href: '/pathways' },
    ],
  },
  students: {
    title: 'For Students',
    links: [
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Apply Now', href: '/apply' },
      { label: 'Funding & Support', href: '/funding' },
      { label: 'Career Services', href: '/career-services' },
      { label: 'Employment Support', href: '/employment-support' },
      { label: 'Success Stories', href: '/success' },
      { label: 'Student Login', href: '/learner/dashboard' },
    ],
  },
  partners: {
    title: 'Partners & Employers',
    links: [
      { label: 'Hire Talent', href: '/employer/dashboard' },
      { label: 'Become a Partner', href: '/partners' },
      { label: '⭐ License Platform', href: '/pricing/platform' },
      { label: 'Apprenticeship Licensing', href: '/pricing/sponsor-licensing' },
      { label: 'Apprenticeships', href: '/employer/apprenticeships' },
      { label: 'Employer Login', href: '/employer/dashboard' },
      { label: 'Partner Login', href: '/program-holder/dashboard' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Team', href: '/about/team' },
      { label: 'Impact & Results', href: '/impact' },
      { label: 'News & Press', href: '/news' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/blog' },
      { label: 'FAQs', href: '/faq' },
      { label: 'Help Center', href: '/help' },
      { label: 'Locations', href: '/locations' },
      { label: 'Sitemap', href: '/site-map' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Terms of Service', href: '/legal' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Transparency', href: '/transparency' },
      { label: 'Compliance', href: '/compliance' },
      { label: 'Agreements', href: '/legal/agreements' },
      { label: 'License Agreement', href: '/legal/license-agreement' },
      { label: 'Governance', href: '/legal/governance' },
    ],
  },
  funding: {
    title: 'Funding',
    links: [
      { label: 'DOL Funding', href: '/funding/dol' },
      { label: 'Federal Programs', href: '/funding/federal-programs' },
      { label: 'JRI Funding', href: '/funding/jri' },
      { label: 'WRG Funding', href: '/funding/wrg' },
      { label: 'Scholarships', href: '/scholarships' },
      { label: 'Tuition', href: '/tuition' },
      { label: 'WIOA Low Income', href: '/wioa-eligibility/low-income' },
      { label: 'WIOA Public Assistance', href: '/wioa-eligibility/public-assistance' },
      { label: 'WIOA Veterans', href: '/wioa-eligibility/veterans' },
    ],
  },
  services: {
    title: 'Services',
    links: [
      { label: 'Career Services', href: '/career-services' },
      { label: 'Employment Support', href: '/employment-support' },
      { label: 'Career Center', href: '/career-center' },
      { label: 'Career Counseling', href: '/career-counseling' },
      { label: 'Mentorship', href: '/mentorship/career-guidance' },
      { label: 'Networking Events', href: '/career-services/networking-events' },
      { label: 'Ongoing Support', href: '/career-services/ongoing-support' },
      { label: 'Community Services', href: '/community-services' },
      { label: 'Drug Testing Training', href: '/drug-testing-training' },
      { label: 'Training Providers', href: '/for-providers' },
      { label: 'Training Certifications', href: '/training/certifications' },
    ],
  },
  platform: {
    title: 'Platform',
    links: [
      { label: 'Platform Overview', href: '/platform/overview' },
      { label: 'Architecture', href: '/platform/architecture' },
      { label: 'Platform Apps', href: '/platform/apps' },
      { label: 'Run a Program with Us', href: '/for-providers' },
      { label: 'Workforce Analytics', href: '/platform/workforce-analytics' },
      { label: 'Workforce Boards', href: '/platform/workforce-boards' },
      { label: 'Partner Portal', href: '/platform/partner-portal' },
      { label: 'Solutions', href: '/solutions' },
      { label: 'White Label', href: '/white-label' },
      { label: 'Features', href: '/features' },
    ],
  },
  store: {
    title: 'Store',
    links: [
      { label: 'Store', href: '/store' },
      { label: 'Courses', href: '/store/courses' },
      { label: 'Digital Products', href: '/store/digital' },
      { label: 'Guides', href: '/store/guides' },
      { label: 'Add-ons', href: '/store/add-ons/analytics-pro' },
      { label: 'Community Hub', href: '/store/add-ons/community-hub' },
      { label: 'Compliance Automation', href: '/store/add-ons/compliance-automation' },
      { label: 'AI Studio', href: '/store/ai-studio' },
      { label: 'Licensing', href: '/license' },
      { label: 'License Features', href: '/license/features' },
      { label: 'License Integrations', href: '/license/integrations' },
      { label: 'License Checkout', href: '/license/checkout' },
      { label: 'Licensing Partnerships', href: '/licensing-partnerships' },
      { label: 'Request License', href: '/licenses/request' },
      { label: 'Purchase License', href: '/licenses/purchase' },
      { label: 'Enterprise Review', href: '/licenses/enterprise-review' },
    ],
  },
  enrollment: {
    title: 'Enrollment',
    links: [
      { label: 'Get Started', href: '/getstarted' },
      { label: 'Start', href: '/start' },
      { label: 'Apply Status', href: '/apply/status' },
      { label: 'Enrollment', href: '/enrollment' },
      { label: 'Enroll Payment', href: '/enroll/payment' },
      { label: 'Booking', href: '/booking/enrollment' },
      { label: 'Eligibility Quiz', href: '/eligibility/quiz' },
      { label: 'Barber Inquiry', href: '/forms/barber-apprenticeship-inquiry' },
      { label: 'Orientation Test', href: '/orientation/competency-test' },
      { label: 'IPLA Exam', href: '/apprenticeships/ipla-exam' },
    ],
  },
  quickLinks: {
    title: 'Quick Links',
    links: [
      { label: 'Agencies', href: '/agencies' },
      { label: 'Analytics', href: '/analytics' },
      { label: 'Approvals', href: '/approvals' },
      { label: 'Call Now', href: '/call-now' },
      { label: 'Connect', href: '/connect' },
      { label: 'Donations', href: '/donate' },
      { label: 'Ecosystem', href: '/ecosystem' },
      { label: 'Email', href: '/email' },
      { label: 'Government', href: '/government' },
      { label: 'For Students', href: '/for-students' },
      { label: 'For Employers', href: '/for-employers' },
      { label: 'Portals', href: '/portals' },
      { label: 'Learning', href: '/learning' },
      { label: 'Learner', href: '/learner' },
      { label: 'Mobile App', href: '/mobile-app' },
      { label: 'Mobile', href: '/mobile' },
      { label: 'Reels', href: '/reels' },
      { label: 'Share', href: '/share' },
      { label: 'Social', href: '/social' },
      { label: 'Community Tax Support', href: '/tax' },
      { label: 'Microclasses', href: '/microclasses' },
      { label: 'Educator Hub', href: '/educatorhub' },
      { label: 'Hub About', href: '/hub/about' },
      { label: 'Funding Impact', href: '/fundingimpact' },
      { label: 'Compliance Report', href: '/compliance/report' },
      { label: 'Mentor Approvals', href: '/mentor/approvals' },
      { label: 'Messages', href: '/messages/new' },
      { label: 'Archived Messages', href: '/messages/archived' },
      { label: 'Training Center', href: '/training/learning-center' },
      { label: 'Workforce Follow-ups', href: '/workforce-board/follow-ups' },
      { label: 'Talent Pipeline', href: '/employer/dashboard' },
      { label: 'Nonprofit Products', href: '/nonprofit/healing-products' },
      { label: 'Revenue Calculator', href: '/calculator/revenue-share' },
      { label: 'Cert Verify', href: '/verify' },
      { label: 'Case Management', href: '/case-manager/dashboard' },
      { label: 'Create Course', href: '/create-course' },
      { label: 'Creator Analytics', href: '/creator/analytics' },
      { label: 'Creator Community', href: '/creator/community' },
      { label: 'Creator Products', href: '/creator/products' },
    ],
  },
  courses: {
    title: 'Courses',
    links: [
      { label: 'NRF', href: '/courses/nrf' },
      { label: 'CNA Certification', href: '/programs/cna' },
      { label: 'Micro Programs', href: '/programs/micro-programs' },
      { label: 'Web Development', href: '/programs/web-development' },
    ],
  },
  onboarding: {
    title: 'Onboarding',
    links: [
      { label: 'Employer Orientation', href: '/onboarding/employer/orientation' },
      { label: 'Staff Orientation', href: '/onboarding/staff/orientation' },
      { label: 'Legal', href: '/onboarding/legal' },
      { label: 'School', href: '/onboarding/school' },
    ],
  },
  solutions: {
    title: 'Solutions',
    links: [
      { label: 'Distance Learning', href: '/solutions/distance-learning' },
      { label: 'Higher Ed', href: '/solutions/higher-ed' },
      { label: 'K-12', href: '/solutions/k12' },
    ],
  },
  pwa: {
    title: 'Mobile Apps',
    links: [
      { label: 'Barber Onboarding', href: '/pwa/barber/onboarding' },
      { label: 'State Board Prep', href: '/pwa/barber/state-board' },
      { label: 'Weekly Summary', href: '/pwa/barber/weekly-summary' },
      { label: 'Shop Owner Register', href: '/pwa/shop-owner/register' },
      { label: 'Shop Owner Reports', href: '/pwa/shop-owner/weekly-report' },
    ],
  },
  policies: {
    title: 'Policies',
    links: [
      { label: 'Editorial Policy', href: '/policies/editorial' },
      { label: 'JRI Policy', href: '/policies/jri' },
      { label: 'SAM.gov Eligibility', href: '/policies/sam-gov-eligibility' },
      { label: 'Drug Test Report', href: '/policies/dr-test-report' },
    ],
  },
  account: {
    title: 'Account',
    links: [
      { label: 'Access Paused', href: '/access-paused' },
      { label: 'License Suspended', href: '/license-suspended' },
      { label: 'Reset Password', href: '/auth/reset-password' },
      { label: 'Verify Email', href: '/verify-email' },
      { label: 'Enterprise', href: '/enterprise' },
      { label: 'Licensing', href: '/licensing' },
      { label: 'Payment Cancel', href: '/payment/cancel' },
      { label: 'Store Checkout Cancel', href: '/store/checkout/cancel' },
      { label: 'Enrollment Confirmation', href: '/enroll/confirmation' },
      { label: 'Marketplace Thank You', href: '/marketplace/thank-you' },
    ],
  },
  demo: {
    title: 'Live Demo',
    links: [
      { label: 'Admin Demo', href: '/demo/admin' },
      { label: 'Employer Demo', href: '/demo/employer' },
      { label: 'Learner Demo', href: '/demo/learner' },
    ],
  },
  internal: {
    title: 'Internal',
    links: [
      { label: 'Cache Diagnostic', href: '/cache-diagnostic' },
      { label: 'Sentry Test', href: '/sentry-test' },
      { label: 'Test Enrollment', href: '/test-enrollment' },
      { label: 'Test Images', href: '/test-images' },
      { label: 'ENV Config', href: '/docs/ENV_CONFIG.md' },
      { label: 'Case Management Docs', href: '/docs/case-management' },
      { label: 'Licensing Architecture', href: '/docs/licensing-architecture' },
      { label: 'Program Holders Docs', href: '/docs/program-holders' },
      { label: 'Reporting Docs', href: '/docs/reporting' },
    ],
  },
  programsAdmin: {
    title: 'Program Administration',
    links: [
      { label: 'Create Course', href: '/program-holder/courses/create' },
      { label: 'Grades', href: '/program-holder/grades' },
      { label: 'How to Use', href: '/program-holder/how-to-use' },
      { label: 'MOU', href: '/program-holder/mou' },
      { label: 'Sign MOU', href: '/program-holder/mou' },
      { label: 'Settings', href: '/program-holder/settings' },
      { label: 'Training', href: '/program-holder/training' },
      { label: 'Portal Students', href: '/program-holder/portal/students' },
      { label: 'Portal Attendance', href: '/program-holder/portal/attendance' },
      { label: 'Portal Messages', href: '/program-holder/portal/messages' },
      { label: 'Portal Reports', href: '/program-holder/reports' },
      { label: 'Portal Live QA', href: '/program-holder/portal/live-qa' },
    ],
  },
  programApply: {
    title: 'Program Applications',
    links: [
      { label: 'CNA Enroll', href: '/programs/cna' },
      { label: 'CPR/First Aid Apply', href: '/programs/cpr-first-aid' },
      { label: 'Culinary Apply', href: '/apply?program=culinary-apprenticeship' },
      { label: 'Electrical Apply', href: '/apply?program=electrical' },
      { label: 'Medical Assistant Apply', href: '/apply?program=medical-assistant' },
      { label: 'Plumbing Apply', href: '/apply?program=plumbing' },
      { label: 'Sanitation Apply', href: '/apply?program=sanitation-infection-control' },
      { label: 'Welding Apply', href: '/apply?program=welding' },
    ],
  },
};

/**
 * UTILITY NAVIGATION
 * Top utility bar links (phone, help, language, login)
 */
export const utilityNavigation = {
  phone: {
    label: '1-800-ELEVATE',
    href: 'tel:1-800-353-8283',
  },
  help: {
    label: 'Help',
    href: '/help',
  },
  login: {
    label: 'Login',
    href: '/login',
  },
  apply: {
    label: 'Apply Now',
    href: '/apply',
  },
};

/**
 * SOCIAL MEDIA LINKS
 */
export const socialLinks = {
  facebook: 'https://www.facebook.com/share/1BUqvUAnCo/',
  // twitter: 'https://twitter.com/elevate4humanity', // Removed per user request
  linkedin: 'https://linkedin.com/company/elevate-for-humanity',
  instagram: 'https://instagram.com/elevateforhumanity',
  youtube: 'https://youtube.com/@elevateforhumanity',
};

/**
 * CONTACT INFORMATION
 */
export const contactInfo = {
  phone: '1-800-ELEVATE (353-8283)',
  email: 'info@www.elevateforhumanity.org',
  address: {
    street: '123 Main Street',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46204',
  },
};
