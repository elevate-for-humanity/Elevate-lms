export type NavItem = {
  label: string;
  href: string;
  group: 'Students' | 'Programs' | 'Ecosystem' | 'Employers' | 'Tax' | 'About';
  showInHeader?: boolean;
  description?: string;
};

export const NAV: NavItem[] = [
  // Students
  { group: 'Students', label: 'Apply', href: '/apply', showInHeader: true, description: 'Start your application' },
  { group: 'Students', label: 'Contact', href: '/contact', showInHeader: true, description: 'Get in touch with us' },
  { group: 'Students', label: 'Login', href: '/login', showInHeader: true, description: 'Access your account' },
  { group: 'Students', label: 'Sign Up', href: '/signup', showInHeader: true, description: 'Create an account' },
  { group: 'Students', label: 'FAQ', href: '/faq', showInHeader: false },

  // Programs
  { group: 'Programs', label: 'All Programs', href: '/programs', showInHeader: true, description: 'View all career pathways' },
  { group: 'Programs', label: 'Apprenticeships', href: '/apprenticeships', showInHeader: true, description: 'Earn while you learn' },
  { group: 'Programs', label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship', showInHeader: true },
  { group: 'Programs', label: 'Healthcare', href: '/programs/healthcare', showInHeader: true },
  { group: 'Programs', label: 'Skilled Trades', href: '/programs/skilled-trades', showInHeader: true },
  { group: 'Programs', label: 'CDL & Transportation', href: '/programs/cdl-transportation', showInHeader: true },
  { group: 'Programs', label: 'Business & Financial', href: '/programs/business-financial', showInHeader: true },
  { group: 'Programs', label: 'Tax & Entrepreneurship', href: '/programs/tax-entrepreneurship', showInHeader: true },

  // WIOA Programs
  { group: 'Programs', label: 'WIOA Programs', href: '/programs/wioa', showInHeader: false },
  { group: 'Programs', label: 'WRG Programs', href: '/programs/wrg', showInHeader: false },
  { group: 'Programs', label: 'JRI Programs', href: '/programs/jri', showInHeader: true },
  { group: 'Programs', label: 'HSI Programs', href: '/programs/hsi', showInHeader: false },
  { group: 'Programs', label: 'NRF Programs', href: '/programs/nrf', showInHeader: false },
  { group: 'Programs', label: 'CareerSafe', href: '/programs/careersafe', showInHeader: false },

  // Employers
  { group: 'Employers', label: 'For Employers', href: '/employers', showInHeader: true, description: 'Hire qualified talent' },
  { group: 'Employers', label: 'Partner With Us', href: '/partner-with-us', showInHeader: true },
  { group: 'Employers', label: 'Workforce Solutions', href: '/workforce-solutions', showInHeader: false },

  // Tax Services
  { group: 'Tax', label: 'Tax Services', href: '/tax', showInHeader: true, description: 'Free and paid tax preparation' },
  { group: 'Tax', label: 'Rise Up Foundation (Free)', href: '/vita', showInHeader: true, description: 'Free tax help for eligible individuals' },
  { group: 'Tax', label: 'SupersonicFastCash (Paid)', href: '/tax/supersonicfastcash', showInHeader: true, description: 'Professional tax preparation' },
  { group: 'Tax', label: 'VITA Volunteer', href: '/vita/volunteer', showInHeader: false },
  { group: 'Tax', label: 'VITA Training', href: '/vita/training', showInHeader: false },
  { group: 'Tax', label: 'Find VITA Site', href: '/vita/locations', showInHeader: false },

  // Ecosystem (for funders/partners - not primary nav)
  { group: 'Ecosystem', label: 'How Elevate Works', href: '/how-it-works', showInHeader: false, description: 'Our role in the workforce system' },
  { group: 'Ecosystem', label: 'For Workforce Boards', href: '/workforce-boards', showInHeader: false },
  { group: 'Ecosystem', label: 'For Funders', href: '/funders', showInHeader: false },

  // About
  { group: 'About', label: 'About Us', href: '/about', showInHeader: true },
  { group: 'About', label: 'Our Story', href: '/about/story', showInHeader: false },
  { group: 'About', label: 'Team', href: '/about/team', showInHeader: false },
  { group: 'About', label: 'Impact', href: '/about/impact', showInHeader: false },
];

// Helper functions
export function getNavByGroup(group: NavItem['group']): NavItem[] {
  return NAV.filter((item) => item.group === group);
}

export function getHeaderNav(): NavItem[] {
  return NAV.filter((item) => item.showInHeader);
}

export function getAllRoutes(): string[] {
  return NAV.map((item) => item.href);
}

export function getNavGroups(): NavItem['group'][] {
  return ['Students', 'Programs', 'Employers', 'Tax', 'About'];
}
