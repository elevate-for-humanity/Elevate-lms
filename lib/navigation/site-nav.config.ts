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
        label: 'CDL Training',
        href: '/programs/cdl-transportation',
        description: 'Commercial Driver License',
      },
      {
        label: 'Business Programs',
        href: '/programs/business-financial',
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
        label: 'Student Login',
        href: '/lms/dashboard',
        description: 'Access your courses',
      },
    ],
  },
  {
    label: 'For Employers',
    items: [
      {
        label: 'Hire Talent',
        href: '/employers',
        description: 'Find job-ready candidates',
      },
      {
        label: 'Post a Job',
        href: '/employers/post-job',
        description: 'List your open positions',
      },
      {
        label: 'Apprenticeships',
        href: '/employers/apprenticeships',
        description: 'Build your workforce',
      },
      {
        label: 'Partner Benefits',
        href: '/employers/benefits',
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
    ],
  },
  {
    label: 'About',
    items: [
      {
        label: 'Our Mission',
        href: '/about',
        description: 'Who we are and what we do',
      },
      { label: 'Our Team', href: '/about/team', description: 'Meet the team' },
      {
        label: 'Impact & Results',
        href: '/impact',
        description: 'Our outcomes and metrics',
      },
      { label: 'News & Press', href: '/news', description: 'Latest updates' },
      { label: 'Contact Us', href: '/contact', description: 'Get in touch' },
    ],
  },
  {
    label: 'Resources',
    items: [
      {
        label: 'Blog',
        href: '/blog',
        description: 'Career advice and insights',
      },
      { label: 'FAQs', href: '/faq', description: 'Common questions answered' },
      {
        label: 'Locations',
        href: '/locations',
        description: 'Find training near you',
      },
      {
        label: 'Sitemap',
        href: '/sitemap',
        description: 'All pages directory',
      },
      {
        label: 'Help Center',
        href: '/help',
        description: 'Support and documentation',
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
      { label: 'Business', href: '/programs/business' },
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
      { label: 'Success Stories', href: '/success' },
      { label: 'Student Login', href: '/lms/dashboard' },
    ],
  },
  partners: {
    title: 'Partners & Employers',
    links: [
      { label: 'Hire Talent', href: '/employers' },
      { label: 'Become a Partner', href: '/partners' },
      { label: '⭐ License Platform', href: '/pricing/platform' },
      { label: 'Apprenticeship Licensing', href: '/pricing/sponsor-licensing' },
      { label: 'Apprenticeships', href: '/employers/apprenticeships' },
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
      { label: 'Sitemap', href: '/sitemap' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Transparency', href: '/transparency' },
      { label: 'Compliance', href: '/compliance' },
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
  facebook: 'https://facebook.com/elevateforhumanity',
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
