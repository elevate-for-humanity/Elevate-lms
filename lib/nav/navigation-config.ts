import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ROUTES } from '@/lib/routes';
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
        description: 'Browse all available programs',
      },
      {
        label: 'Apprenticeships',
        href: '/programs/apprenticeships',
        description: 'Earn while you learn',
        subItems: [
          { label: 'Barber Apprenticeship', href: '/programs/barber-apprenticeship' },
          { label: 'HVAC Technician', href: '/programs/hvac-technician' },
          { label: 'Building Maintenance', href: '/programs/building-maintenance' },
          { label: 'Cosmetology', href: '/programs/cosmetology-apprenticeship' },
          { label: 'Esthetics', href: '/programs/esthetician-apprenticeship' },
          { label: 'Nail Technology', href: '/programs/nail-technician-apprenticeship' },
        ],
      },
      {
        label: 'WIOA Programs',
        href: '/programs/federal-funded',
        description: 'Federally funded training',
        subItems: [
          { label: 'CNA', href: '/programs/cna' },
          { label: 'Phlebotomy Technician', href: '/programs/healthcare' },
          { label: 'Home Health Aide', href: '/programs/home-health-aide' },
          { label: 'Direct Support Professional', href: '/programs/direct-support-professional' },
          { label: 'CDL', href: '/programs/cdl-training' },
          { label: 'CPR & First Aid', href: '/programs/cpr-first-aid' },
        ],
      },
      {
        label: 'JRI Programs',
        href: '/partners/jri',
        description: 'Justice-involved reentry programs',
        subItems: [
          { label: 'CNA', href: '/programs/cna' },
          { label: 'Phlebotomy Technician', href: '/programs/healthcare' },
          { label: 'CDL', href: '/programs/cdl-training' },
          { label: 'Workforce Readiness', href: '/programs/workforce-readiness' },
        ],
      },
    ],
  },
  {
    label: 'Resources',
    href: '/resources',
    description: 'Tools and information for all audiences',
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
    ],
  },
  {
    label: 'Partner With Us',
    href: ROUTES.HOST_SHOPS,
    description: 'Host apprentices and grow your team',
    subItems: [
      { label: 'Host Shop Partner Program', href: ROUTES.HOST_SHOPS },
      { label: 'Apply as Host Shop', href: ROUTES.HOST_SHOP_APPLY },
      { label: 'Partner Login', href: '/partner/login' },
      { label: 'Platform Licensing', href: '/partners/licensing' },
    ],
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
      { label: 'JRI Programs', href: '/partners/jri' },
      { label: 'Academic Calendar', href: '/academic-calendar' },
      { label: 'Tuition & Fees', href: '/tuition' },
      { label: 'Eligibility', href: '/eligibility' },
      { label: 'Training', href: '/training' },
    ],
  },
  services: {
    title: 'Services',
    links: [
      { label: 'Career Counseling', href: '/career-counseling' },
      { label: 'Career Assessment', href: '/career-assessment' },
      { label: 'Tutoring', href: '/tutoring' },
      { label: 'Writing Center', href: '/writing-center' },
      { label: 'WorkKeys / NCRC', href: '/workkeys' },
      { label: 'Certification Testing', href: '/certification-testing' },
      { label: 'Scholarships', href: '/scholarships' },
    ],
  },
  partners: {
    title: 'Partners',
    links: [
      { label: 'Platform Licensing', href: '/partners/licensing' },
      { label: 'Workforce Boards', href: '/resources#workforce' },
      { label: 'Training Providers', href: '/resources#partners' },
      { label: 'Become a Program Holder', href: '/apply/program-holder' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Team', href: '/team' },
      { label: 'Founder', href: '/founder' },
      { label: 'Press', href: '/press' },
      { label: 'Transparency', href: '/transparency' },
      { label: 'Approvals', href: '/approvals' },
      { label: 'Credentials', href: '/credentials' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', href: '/legal' },
      { label: 'Privacy Policy', href: '/legal/privacy' },
      { label: 'Refund Policy', href: '/refund' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Security', href: '/security' },
      { label: 'Copyright', href: '/copyright' },
    ],
  },
};

/**
 * Dashboard Navigation (Role-Based)
 */
export const dashboardNavigation = {
  student: [
    { label: 'Dashboard', href: '/lms/dashboard', icon: 'home' },
    { label: 'My Lessons', href: '/lms/courses', icon: 'book' },
    { label: 'Transcript', href: '/transcript', icon: 'file-text' },
    { label: 'Leaderboard', href: '/leaderboard', icon: 'award' },
    { label: 'Downloads', href: '/downloads', icon: 'download' },
    { label: 'Tutoring', href: '/tutoring', icon: 'help-circle' },
    { label: 'Writing Center', href: '/writing-center', icon: 'edit' },
    { label: 'Career Counseling', href: '/career-counseling', icon: 'briefcase' },
    { label: 'Career Assessment', href: '/career-assessment', icon: 'clipboard' },
    { label: 'WorkKeys', href: '/workkeys', icon: 'key' },
    { label: 'Log Hours', href: '/lms/hours', icon: 'clock' },
    { label: 'Documents', href: '/lms/documents', icon: 'file' },
    { label: 'Downloads', href: '/downloads', icon: 'download' },
    { label: 'Appointments', href: '/lms/appointments', icon: 'calendar' },
    { label: 'Academic Integrity', href: '/academic-integrity', icon: 'shield' },
    { label: 'Billing', href: '/billing', icon: 'credit-card' },
    { label: 'Apps', href: '/apps', icon: 'grid' },
    { label: 'Profile', href: '/lms/profile', icon: 'user' },
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
    { label: 'Users', href: '/admin/staff', icon: 'users' },
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
    { label: 'Schedule Appointment', href: '/lms/appointments/new', icon: 'calendar' },
    { label: 'Upload Document', href: '/lms/documents/upload', icon: 'upload' },
    { label: 'Get Help', href: '/contact', icon: 'help-circle' },
  ],
  visitor: [
    { label: 'Browse Programs', href: '/programs', icon: 'book' },
    { label: 'Apply Now', href: '/apply', icon: 'file-text' },
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
    display: PLATFORM_DEFAULTS.supportPhone,
    tel: '+13173143757',
  },
  email: {
    general: 'info@elevateforhumanity.org',
    support: 'info@elevateforhumanity.org',
    security: 'security@www.elevateforhumanity.org',
  },
  address: {
    street: '120 Market St Suite 930',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46204',
    full: '120 Market St Suite 930, Indianapolis, IN 46204',
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
