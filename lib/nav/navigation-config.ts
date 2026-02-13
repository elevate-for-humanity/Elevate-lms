/**
 * Navigation Configuration for Elevate for Humanity
 * Central source of truth for all navigation links
 */

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  subItems?: NavItem[];
}

/**
 * Main Navigation Structure
 */
export const mainNavigation: NavItem[] = [
  {
    label: 'Programs',
    href: '/programs',
    description: 'Training programs and apprenticeships',
    subItems: [
      {
        label: 'All Programs',
        href: '/programs',
        description: 'Browse all available programs'
      },
      {
        label: 'Apprenticeships',
        href: '/programs/apprenticeships',
        description: 'Earn while you learn',
        subItems: [
          { label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
          { label: 'HVAC Technician', href: '/programs/hvac-technician' },
          { label: 'Building Maintenance', href: '/programs/building-maintenance' },
          { label: 'Building Technician', href: '/programs/building-technician' },
        ]
      },
      {
        label: 'WIOA Programs',
        href: '/programs/federal-funded',
        description: 'Federally funded training',
        subItems: [
          { label: 'CNA', href: '/programs/cna' },
          { label: 'Phlebotomy Technician', href: '/programs/phlebotomy-technician' },
          { label: 'Home Health Aide', href: '/programs/home-health-aide' },
          { label: 'Direct Support Professional', href: '/programs/direct-support-professional' },
          { label: 'CDL', href: '/programs/cdl' },
          { label: 'CPR & First Aid', href: '/programs/cpr-first-aid-hsi' },
          { label: 'Peer Recovery Coach', href: '/programs/peer-recovery-coach' },
        ]
      },
      {
        label: 'JRI Programs',
        href: '/programs/jri',
        description: 'Justice-involved reentry programs',
        subItems: [
          { label: 'CNA', href: '/programs/cna' },
          { label: 'Phlebotomy Technician', href: '/programs/phlebotomy-technician' },
          { label: 'CDL', href: '/programs/cdl' },
          { label: 'Workforce Readiness', href: '/programs/workforce-readiness' },
          { label: 'Peer Recovery Coach', href: '/programs/peer-recovery-coach' },
        ]
      },
    ]
  },
  {
    label: 'Resources',
    href: '/resources',
    description: 'Tools and information for all audiences',
  },
  {
    label: 'Tax Services',
    href: '/tax',
    description: 'Free and paid tax preparation',
    subItems: [
      {
        label: 'Free Tax Prep (VITA)',
        href: '/tax/vita',
        description: 'IRS-certified free tax preparation'
      },
      {
        label: 'Paid Tax Services',
        href: '/tax/supersonicfastcash',
        description: 'Professional tax services'
      },
      {
        label: 'Volunteer',
        href: '/volunteer',
        description: 'Become a VITA volunteer'
      },
    ]
  },
  {
    label: 'About',
    href: '/about',
    description: 'Our mission and team',
    subItems: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Team', href: '/team' },
      { label: 'Founder', href: '/founder' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Success Stories', href: '/success-stories' },
    ]
  },
  {
    label: 'Platform Licensing',
    href: '/partners/licensing',
    description: 'B2B SaaS for organizations',
  },
];

/**
 * Footer Navigation
 */
export const footerNavigation = {
  programs: {
    title: 'Programs',
    links: [
      { label: 'All Programs', href: '/programs' },
      { label: 'Apprenticeships', href: '/programs/apprenticeships' },
      { label: 'WIOA Programs', href: '/programs/federal-funded' },
      { label: 'JRI Programs', href: '/programs/jri' },
    ]
  },
  services: {
    title: 'Services',
    links: [
      { label: 'Free Tax Prep', href: '/tax/vita' },
      { label: 'Paid Tax Services', href: '/tax/supersonicfastcash' },
      { label: 'Case Management', href: '/resources#students' },
      { label: 'Career Counseling', href: '/resources#students' },
    ]
  },
  partners: {
    title: 'Partners',
    links: [
      { label: 'Platform Licensing', href: '/partners/licensing' },
      { label: 'Workforce Boards', href: '/resources#workforce' },
      { label: 'Training Providers', href: '/resources#partners' },
      { label: 'Become a Partner', href: '/partners/apply' },
    ]
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Team', href: '/team' },
      { label: 'Founder', href: '/founder' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ]
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Security', href: '/security' },
      { label: 'Copyright', href: '/copyright' },
    ]
  }
};

/**
 * Dashboard Navigation (Role-Based)
 */
export const dashboardNavigation = {
  student: [
    { label: 'Dashboard', href: '/student/dashboard-new', icon: 'home' },
    { label: 'My Lessons', href: '/student/lessons', icon: 'book' },
    { label: 'Log Hours', href: '/student/hours', icon: 'clock' },
    { label: 'Documents', href: '/student/documents', icon: 'file' },
    { label: 'Appointments', href: '/student/appointments', icon: 'calendar' },
    { label: 'Profile', href: '/student/profile', icon: 'user' },
  ],
  programHolder: [
    { label: 'Dashboard', href: '/program-holder/dashboard', icon: 'home' },
    { label: 'Students', href: '/program-holder/students', icon: 'users' },
    { label: 'Verifications', href: '/program-holder/verifications', icon: 'check' },
    { label: 'Reports', href: '/program-holder/reports', icon: 'chart' },
    { label: 'Settings', href: '/program-holder/settings', icon: 'settings' },
  ],
  workforceBoard: [
    { label: 'Dashboard', href: '/workforce-board/dashboard', icon: 'home' },
    { label: 'Participants', href: '/workforce-board/participants', icon: 'users' },
    { label: 'Programs', href: '/workforce-board/training', icon: 'book' },
    { label: 'Eligibility', href: '/workforce-board/eligibility', icon: 'check' },
    { label: 'Reports', href: '/workforce-board/reports', icon: 'chart' },
    { label: 'Employment', href: '/workforce-board/employment', icon: 'briefcase' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: 'home' },
    { label: 'At-Risk Students', href: '/admin/at-risk', icon: 'alert' },
    { label: 'Organizations', href: '/admin/organizations', icon: 'building' },
    { label: 'Programs', href: '/admin/programs', icon: 'book' },
    { label: 'Users', href: '/admin/users', icon: 'users' },
    { label: 'Reports', href: '/admin/reports', icon: 'chart' },
    { label: 'Settings', href: '/admin/settings', icon: 'settings' },
  ],
};

/**
 * Quick Actions (Context-Aware)
 */
export const quickActions = {
  student: [
    { label: 'Apply for Program', href: '/apply', icon: 'file-text' },
    { label: 'Schedule Appointment', href: '/student/appointments/new', icon: 'calendar' },
    { label: 'Upload Document', href: '/student/documents/upload', icon: 'upload' },
    { label: 'Get Help', href: '/contact', icon: 'help-circle' },
  ],
  visitor: [
    { label: 'Browse Programs', href: '/programs', icon: 'book' },
    { label: 'Apply Now', href: '/apply', icon: 'file-text' },
    { label: 'Free Tax Prep', href: '/tax/vita', icon: 'calculator' },
    { label: 'Contact Us', href: '/contact', icon: 'phone' },
  ],
};

/**
 * Social Media Links
 */
export const socialLinks = {
  facebook: 'https://www.facebook.com/profile.php?id=61571046346179',
  instagram: 'https://instagram.com/elevateforhumanity',
  linkedin: 'https://www.linkedin.com/in/elevate-for-humanity-b5a2b3339/',
};

/**
 * Contact Information
 */
export const contactInfo = {
  phone: {
    display: '(317) 314-3757',
    tel: '+13173143757',
  },
  email: {
    general: 'elevate4humanityedu@gmail.com',
    support: 'elevate4humanityedu@gmail.com',
    security: 'security@www.elevateforhumanity.org',
  },
  address: {
    street: '8888 Keystone Crossing Suite 1300',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46240',
    full: '8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240',
  },
  hours: {
    office: 'Monday-Friday, 9:00 AM - 5:00 PM EST',
    support: '24/7 - Always Available',
  },
};

/**
 * Helper function to get navigation for role
 */
export function getNavigationForRole(role: string): NavItem[] {
  switch (role) {
    case 'student':
      return dashboardNavigation.student;
    case 'program_holder':
      return dashboardNavigation.programHolder;
    case 'workforce_board':
      return dashboardNavigation.workforceBoard;
    case 'admin':
      return dashboardNavigation.admin;
    default:
      return [];
  }
}

/**
 * Helper function to get quick actions for role
 */
export function getQuickActionsForRole(role?: string) {
  if (!role) return quickActions.visitor;
  if (role === 'student') return quickActions.student;
  return quickActions.visitor;
}
